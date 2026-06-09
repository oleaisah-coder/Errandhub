const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const flutterwaveService = require('../services/flutterwaveService');

function getFlwPublicKey() {
  return process.env.FLUTTERWAVE_PUBLIC_KEY || '';
}

async function ensureWallet(userId) {
  const existing = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await pool.query(
    'INSERT INTO wallets (id, user_id, balance) VALUES ($1, $2, 0) RETURNING *',
    [uuidv4(), userId]
  );
  return result.rows[0];
}

async function getWallet(req, res) {
  try {
    const userId = req.user.id;
    const wallet = await ensureWallet(userId);

    const txResult = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 AND payment_type IN ('wallet_funding', 'order_payment') ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    res.json({
      balance: parseFloat(wallet.balance) || 0,
      transactions: txResult.rows.map(tx => ({
        id: tx.id,
        amount: parseFloat(tx.amount),
        type: tx.payment_type === 'wallet_funding'
          ? (tx.status === 'completed' ? 'credit' : 'pending')
          : (tx.status === 'completed' ? 'debit' : 'pending'),
        description: tx.payment_type === 'wallet_funding' ? 'Wallet top up' : `Order payment${tx.order_id ? ` (${tx.order_id.slice(0, 8)}...)` : ''}`,
        reference: tx.reference,
        status: tx.status,
        createdAt: tx.created_at,
      })),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function initializeWalletFunding(req, res) {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum amount is ₦100' });
    }

    const tx_ref = flutterwaveService.generateTransactionReference();

    const paymentId = uuidv4();
    await pool.query(
      `INSERT INTO payments (id, user_id, amount, currency, reference, status, payment_type, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [paymentId, userId, amount, 'NGN', tx_ref, 'pending', 'wallet_funding', 'card']
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://errandhub.vercel.app';

    const initResult = await flutterwaveService.initializeTransaction({
      tx_ref,
      amount,
      currency: 'NGN',
      customer: {
        email: req.user.email,
        name: `${req.user.first_name} ${req.user.last_name}`,
        phone_number: req.user.phone || '',
      },
      redirect_url: `${frontendUrl}/wallet?payment_status=completed`,
    });

    if (!initResult.success) {
      await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['failed', paymentId]);
      return res.status(502).json({ message: initResult.error || 'Payment initialization failed' });
    }

    res.json({
      tx_ref,
      public_key: getFlwPublicKey(),
      amount,
      currency: 'NGN',
      customer: {
        email: req.user.email,
        name: `${req.user.first_name} ${req.user.last_name}`,
        phone_number: req.user.phone || '',
      },
      payment_link: initResult.link || null,
    });
  } catch (error) {
    console.error('Initialize wallet funding error:', error);
    res.status(500).json({ message: 'Server error: ' + (error.message || error) });
  }
}

async function verifyTransaction(req, res) {
  const client = await pool.connect();
  try {
    const { transaction_id, tx_ref } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const verifyResult = await flutterwaveService.verifyTransaction(transaction_id);

    if (!verifyResult.success) {
      return res.status(502).json({ message: verifyResult.error || 'Verification failed' });
    }

    const txData = verifyResult.data;
    const reference = tx_ref || txData.tx_ref;

    await client.query('BEGIN');

    const paymentResult = await client.query(
      'SELECT * FROM payments WHERE reference = $1 FOR UPDATE',
      [reference]
    );

    if (paymentResult.rows.length === 0) {
      await client.query('COMMIT');
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const payment = paymentResult.rows[0];

    if (txData.tx_ref !== payment.reference) {
      await client.query('COMMIT');
      console.error('tx_ref mismatch: FLW returned', txData.tx_ref, 'but DB has', payment.reference);
      return res.status(400).json({ message: 'Transaction reference mismatch. Payment rejected.' });
    }

    if (payment.status === 'completed') {
      await client.query('COMMIT');
      return res.json({ message: 'Payment already verified', status: 'completed' });
    }

    const isSuccessful = txData.status === 'successful';

    if (isSuccessful && Math.abs(txData.amount - parseFloat(payment.amount)) < 0.01) {
      await client.query(
        `UPDATE payments SET status = $1, flutterwave_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        ['completed', transaction_id.toString(), payment.id]
      );

      if (payment.payment_type === 'wallet_funding') {
        const wallet = await ensureWallet(payment.user_id);
        await client.query(
          'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [payment.amount, wallet.id]
        );
      } else if (payment.payment_type === 'order_payment' && payment.order_id) {
        await client.query(
          `UPDATE orders SET status = 'PENDING_ADMIN_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [payment.order_id]
        );
      }

      await client.query('COMMIT');
      return res.json({ message: 'Payment verified successfully', status: 'completed' });
    } else {
      await client.query(
        `UPDATE payments SET status = $1, flutterwave_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        ['failed', transaction_id.toString(), payment.id]
      );

      await client.query('COMMIT');
      return res.json({ message: 'Payment verification failed', status: 'failed' });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verify transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
}

async function webhookHandler(req, res) {
  let client;
  try {
    const signature = req.headers['verif-hash'];

    if (!signature || signature !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
      console.warn(`Webhook signature verification failed. IP: ${req.ip}, Signature: ${signature ? 'present' : 'missing'}`);
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body;

    if (event.event === 'charge.completed' && event.data) {
      const txData = event.data;
      const reference = txData.tx_ref;

      client = await pool.connect();
      await client.query('BEGIN');

      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE reference = $1 FOR UPDATE',
        [reference]
      );

      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];

        if (payment.status !== 'completed' && txData.status === 'successful') {
          const verifyResult = await flutterwaveService.verifyTransaction(txData.id);
          if (!verifyResult.success || verifyResult.data?.status !== 'successful') {
            console.warn('Webhook: Flutterwave re-verification failed for tx', txData.id);
            await client.query('COMMIT');
            return res.status(502).json({ message: 'Webhook received but re-verification failed' });
          }

          if (verifyResult.data?.tx_ref !== payment.reference) {
            console.error('Webhook: tx_ref mismatch during re-verification');
            await client.query('COMMIT');
            return res.status(502).json({ message: 'Webhook received but reference mismatch' });
          }

          if (Math.abs(verifyResult.data?.amount - parseFloat(payment.amount)) >= 0.01) {
            console.warn('Webhook: amount mismatch for tx', txData.id);
            await client.query('COMMIT');
            return res.status(502).json({ message: 'Webhook received but amount mismatch' });
          }

          await client.query(
            `UPDATE payments SET status = $1, flutterwave_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            ['completed', txData.id.toString(), payment.id]
          );

          if (payment.payment_type === 'wallet_funding') {
            const wallet = await ensureWallet(payment.user_id);
            await client.query(
              'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [payment.amount, wallet.id]
            );
          } else if (payment.payment_type === 'order_payment' && payment.order_id) {
            await client.query(
              `UPDATE orders SET status = 'PENDING_ADMIN_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [payment.order_id]
            );
          }
        }
      }

      await client.query('COMMIT');
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Webhook handler error:', error);
    res.status(502).json({ message: 'Webhook processing failed' });
  } finally {
    if (client) client.release();
  }
}

async function deductFromWallet(req, res) {
  try {
    const { amount, order_id } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!order_id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // BUG FIX: Use SELECT FOR UPDATE to lock the wallet row within the transaction.
      // Without this, concurrent requests can both read the same balance, both pass the
      // balance check, and both deduct — resulting in a negative balance.
      const walletResult = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      let wallet;
      if (walletResult.rows.length === 0) {
        // Create wallet inside the transaction so the lock covers the new row too
        const created = await client.query(
          'INSERT INTO wallets (id, user_id, balance) VALUES ($1, $2, 0) RETURNING *',
          [uuidv4(), userId]
        );
        wallet = created.rows[0];
      } else {
        wallet = walletResult.rows[0];
      }

      if (parseFloat(wallet.balance) < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      await client.query(
        'UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, wallet.id]
      );

      const tx_ref = flutterwaveService.generateTransactionReference();
      await client.query(
        `INSERT INTO payments (id, user_id, order_id, amount, currency, reference, status, payment_type, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [uuidv4(), userId, order_id, amount, 'NGN', tx_ref, 'completed', 'order_payment', 'wallet']
      );

      await client.query(
        `UPDATE orders SET status = 'PENDING_ADMIN_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
        [order_id, userId]
      );

      await client.query('COMMIT');

      // Read updated balance outside the lock
      const updatedWalletResult = await pool.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      res.json({
        message: 'Payment successful',
        balance: parseFloat(updatedWalletResult.rows[0]?.balance) || 0,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Deduct from wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function initializeOrderPayment(req, res) {
  try {
    const {
      errandType, items, pickupAddress, pickupCity, pickupState,
      deliveryAddress, deliveryCity, deliveryState,
      itemFee, deliveryFee, serviceFee, totalAmount,
      notes, scheduledFor, isEmergency,
    } = req.body;

    const userId = req.user.id;

    if (!totalAmount || totalAmount < 100) {
      return res.status(400).json({ message: 'Invalid order total' });
    }

    const orderId = uuidv4();
    const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const tx_ref = flutterwaveService.generateTransactionReference();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (id, order_number, user_id, errand_type, status,
          pickup_address, pickup_city, pickup_state,
          delivery_address, delivery_city, delivery_state,
          item_fee, delivery_fee, service_fee, total_amount,
          notes, scheduled_for, is_emergency)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          orderId, orderNumber, userId, errandType,
          pickupAddress || '', pickupCity || '', pickupState || '',
          deliveryAddress, deliveryCity, deliveryState,
          itemFee || 0, deliveryFee || 0, serviceFee || 0, totalAmount,
          notes || null, scheduledFor || null, isEmergency || false,
        ]
      );

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await client.query(
            `INSERT INTO order_items (id, order_id, name, description, quantity, estimated_price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), orderId, item.name, item.description || null, item.quantity, item.estimatedPrice]
          );
        }
      }

      await client.query(
        `INSERT INTO payments (id, user_id, order_id, amount, currency, reference, status, payment_type, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [uuidv4(), userId, orderId, totalAmount, 'NGN', tx_ref, 'pending', 'order_payment', 'card']
      );

      const frontendUrl = process.env.FRONTEND_URL || 'https://errandhub.vercel.app';

      const initResult = await flutterwaveService.initializeTransaction({
        tx_ref,
        amount: totalAmount,
        currency: 'NGN',
        customer: {
          email: req.user.email,
          name: `${req.user.first_name} ${req.user.last_name}`,
          phone_number: req.user.phone || '',
        },
        redirect_url: `${frontendUrl}/order-history?payment_status=completed`,
      });

      if (!initResult.success) {
        await client.query('ROLLBACK');
        return res.status(502).json({ message: initResult.error || 'Payment initialization failed' });
      }

      await client.query(
        `INSERT INTO notifications (id, user_id, title, message, type, order_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), userId, 'Order Pending Payment',
         `Your order ${orderNumber} is pending payment confirmation.`, 'order', orderId]
      );

      await client.query('COMMIT');

      res.json({
        tx_ref,
        order_id: orderId,
        order_number: orderNumber,
        public_key: getFlwPublicKey(),
        amount: totalAmount,
        currency: 'NGN',
        customer: {
          email: req.user.email,
          name: `${req.user.first_name} ${req.user.last_name}`,
          phone_number: req.user.phone || '',
        },
        payment_link: initResult.link || null,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Initialize order payment error:', error);
    res.status(500).json({ message: 'Server error: ' + (error.message || error) });
  }
}

module.exports = {
  getWallet,
  initializeWalletFunding,
  verifyTransaction,
  webhookHandler,
  deductFromWallet,
  initializeOrderPayment,
};
