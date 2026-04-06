const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${timestamp}${random}`;
};

// Create new order
const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      errandType,
      items,
      pickupAddress,
      pickupCity,
      pickupState,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      itemFee,
      deliveryFee,
      serviceFee,
      totalAmount,
      notes,
      scheduledFor,
      isEmergency,
      // paymentReference - explicitly ignored for stabilization
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      console.error('Create order blocked: User ID missing');
      return res.status(401).json({ message: 'User ID missing from request' });
    }

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    // ── Payment Decoupling ─────────────────────────────────────
    // Ensuring the system accepts orders without external gateway flags.
    // Order status is set to 'PENDING_ADMIN_REVIEW' per platform logic.
    const INITIAL_STATUS = 'PENDING_ADMIN_REVIEW'; 

    await client.query('BEGIN');

    // 1. Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        id, order_number, user_id, errand_type, status,
        pickup_address, pickup_city, pickup_state,
        delivery_address, delivery_city, delivery_state,
        item_fee, delivery_fee, service_fee, total_amount,
        notes, scheduled_for, is_emergency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        orderId, orderNumber, userId, errandType, INITIAL_STATUS,
        pickupAddress, pickupCity, pickupState,
        deliveryAddress, deliveryCity, deliveryState,
        itemFee || 0, deliveryFee || 0, serviceFee || 0, totalAmount || 0,
        notes, scheduledFor || null, isEmergency || false,
      ]
    );

    // 2. Create order items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, name, description, quantity, estimated_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), orderId, item.name, item.description || null, item.quantity, item.estimatedPrice]
        );
      }
    }

    // 3. Create notification for user
    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        userId,
        'Order Created',
        `Your order ${orderNumber} has been created successfully and is awaiting review.`,
        'order',
        orderId,
      ]
    );

    await client.query('COMMIT');

    const order = orderResult.rows[0];

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        errandType: order.errand_type,
        status: order.status,
        amount: order.total_amount,
        totalAmount: order.total_amount,
        items: items,
        pickupAddress: {
          street: order.pickup_address,
          city: order.pickup_city,
          state: order.pickup_state,
        },
        deliveryAddress: {
          street: order.delivery_address,
          city: order.delivery_city,
          state: order.delivery_state,
        },
        itemFee: order.item_fee,
        deliveryFee: order.delivery_fee,
        serviceFee: order.service_fee,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('CRITICAL: Order creation failed on backend:', {
      error: error.message,
      stack: error.stack,
      payload: req.body
    });
    res.status(500).json({ 
      message: 'Checkout unavailable - database error',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Get all orders for current user
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT o.*, 
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'description', oi.description,
            'quantity', oi.quantity,
            'estimatedPrice', oi.estimated_price,
            'actualPrice', oi.actual_price
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items,
        json_build_object(
          'id', r.id,
          'firstName', ru.first_name,
          'lastName', ru.last_name,
          'phone', ru.phone,
          'rating', r.rating
        ) as runner
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN runners r ON o.runner_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE o.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND o.status = $2`;
      params.push(status);
    }

    query += `
      GROUP BY o.id, r.id, ru.first_name, ru.last_name, ru.phone, r.rating
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      orders: result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        errandType: order.errand_type,
        status: order.status,
        items: order.items || [],
        pickupAddress: order.pickup_address,
        pickupCity: order.pickup_city,
        pickupState: order.pickup_state,
        deliveryAddress: order.delivery_address,
        deliveryCity: order.delivery_city,
        deliveryState: order.delivery_state,
        itemFee: order.item_fee,
        deliveryFee: order.delivery_fee,
        serviceFee: order.service_fee,
        totalAmount: order.total_amount,
        notes: order.notes,
        scheduledFor: order.scheduled_for,
        isEmergency: order.is_emergency,
        rating: order.rating,
        review: order.review,
        runner: order.runner?.id ? order.runner : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        deliveredAt: order.delivered_at,
      })),
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT o.*, 
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'description', oi.description,
            'quantity', oi.quantity,
            'estimatedPrice', oi.estimated_price,
            'actualPrice', oi.actual_price
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items,
        json_build_object(
          'id', r.id,
          'firstName', ru.first_name,
          'lastName', ru.last_name,
          'phone', ru.phone,
          'rating', r.rating,
          'vehicleType', r.vehicle_type
        ) as runner
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN runners r ON o.runner_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE o.id = $1
    `;

    const params = [id];

    // If not admin, restrict to user's own orders or runner's assigned orders
    if (userRole !== 'admin') {
      query += ` AND (o.user_id = $2 OR o.runner_id IN (SELECT id FROM runners WHERE user_id = $2))`;
      params.push(userId);
    }

    query += ` GROUP BY o.id, r.id, ru.first_name, ru.last_name, ru.phone, r.rating, r.vehicle_type`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    res.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        errandType: order.errand_type,
        status: order.status,
        items: order.items || [],
        pickupAddress: order.pickup_address,
        pickupCity: order.pickup_city,
        pickupState: order.pickup_state,
        deliveryAddress: order.delivery_address,
        deliveryCity: order.delivery_city,
        deliveryState: order.delivery_state,
        itemFee: order.item_fee,
        deliveryFee: order.delivery_fee,
        serviceFee: order.service_fee,
        totalAmount: order.total_amount,
        notes: order.notes,
        scheduledFor: order.scheduled_for,
        isEmergency: order.is_emergency,
        rating: order.rating,
        review: order.review,
        runner: order.runner?.id ? order.runner : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        deliveredAt: order.delivered_at,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualPrices } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get current order
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check permissions
    if (userRole === 'user' && order.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (userRole === 'runner') {
      const runnerResult = await pool.query(
        'SELECT id FROM runners WHERE user_id = $1',
        [userId]
      );
      if (runnerResult.rows.length === 0 || order.runner_id !== runnerResult.rows[0].id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Update actual prices if provided
    if (actualPrices && Array.isArray(actualPrices)) {
      for (const item of actualPrices) {
        await pool.query(
          'UPDATE order_items SET actual_price = $1 WHERE id = $2 AND order_id = $3',
          [item.actualPrice, item.id, id]
        );
      }
    }

    // Update order status
    const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (status === 'delivered') {
      updateFields.push('delivered_at = CURRENT_TIMESTAMP');
    }

    params.push(id);

    await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${params.length}`,
      params
    );

    // Create notification for user
    const statusMessages = {
      confirmed: 'Your order has been confirmed.',
      runner_assigned: 'A runner has been assigned to your order.',
      item_purchased: 'Your items have been purchased.',
      on_the_way: 'Your order is on the way!',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.',
    };

    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        order.user_id,
        `Order ${status.replace('_', ' ').toUpperCase()}`,
        statusMessages[status] || `Your order status has been updated to ${status}.`,
        'order',
        id,
      ]
    );

    res.json({
      message: 'Order status updated successfully',
      order: {
        id,
        status,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign runner to order
const assignRunner = async (req, res) => {
  try {
    const { id } = req.params;
    const { runnerId } = req.body;

    // Check if order exists
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if runner exists
    const runnerResult = await pool.query(
      'SELECT r.*, u.first_name, u.last_name FROM runners r JOIN users u ON r.user_id = u.id WHERE r.id = $1',
      [runnerId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Runner not found' });
    }

    // Update order
    await pool.query(
      `UPDATE orders SET runner_id = $1, status = 'runner_assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [runnerId, id]
    );

    const order = orderResult.rows[0];
    const runner = runnerResult.rows[0];

    // Create notification for user
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        order.user_id,
        'Runner Assigned',
        `${runner.first_name} ${runner.last_name} has been assigned to your order.`,
        'order',
        id,
      ]
    );

    res.json({
      message: 'Runner assigned successfully',
      order: {
        id,
        runnerId,
        status: 'runner_assigned',
      },
    });
  } catch (error) {
    console.error('Assign runner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get order
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check permissions
    if (userRole === 'user' && order.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'cancelled', 'on_the_way', 'item_purchased'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: order.status === 'cancelled' 
          ? 'Order is already cancelled' 
          : `Cannot cancel order with status "${order.status.replace('_', ' ')}"`
      });
    }

    // Update order
    await pool.query(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        order.user_id,
        'Order Cancelled',
        'Your order has been cancelled.',
        'order',
        id,
      ]
    );

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Rate order
const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    // Get order
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate delivered orders' });
    }

    // Update order with rating
    await pool.query(
      `UPDATE orders SET rating = $1, review = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [rating, review || null, id]
    );

    // Update runner rating
    if (order.runner_id) {
      const runnerOrders = await pool.query(
        'SELECT AVG(rating) as avg_rating FROM orders WHERE runner_id = $1 AND rating IS NOT NULL',
        [order.runner_id]
      );
      
      const avgRating = runnerOrders.rows[0].avg_rating || 5;
      
      await pool.query(
        'UPDATE runners SET rating = $1 WHERE id = $2',
        [avgRating, order.runner_id]
      );
    }

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  assignRunner,
  cancelOrder,
  rateOrder,
};
