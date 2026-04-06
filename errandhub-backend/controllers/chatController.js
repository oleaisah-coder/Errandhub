const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// Get chat messages for an order
const getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND (
        user_id = $2 OR 
        runner_id IN (SELECT id FROM runners WHERE user_id = $2) OR
        $3 = 'admin'
      )`,
      [orderId, userId, req.user.role]
    );

    if (orderResult.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get messages
    const result = await pool.query(`
      SELECT m.*, 
        json_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'role', u.role
        ) as sender
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.order_id = $1
      ORDER BY m.created_at ASC
    `, [orderId]);

    // Mark messages as read
    await pool.query(
      `UPDATE chat_messages SET is_read = true 
       WHERE order_id = $1 AND sender_id != $2 AND is_read = false`,
      [orderId, userId]
    );

    res.json({
      messages: result.rows.map(msg => ({
        id: msg.id,
        orderId: msg.order_id,
        senderId: msg.sender_id,
        sender: msg.sender,
        message: msg.message,
        isRead: msg.is_read,
        createdAt: msg.created_at,
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    // Check if user has access to this order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND (
        user_id = $2 OR 
        runner_id IN (SELECT id FROM runners WHERE user_id = $2) OR
        $3 = 'admin'
      )`,
      [orderId, senderId, req.user.role]
    );

    if (orderResult.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const order = orderResult.rows[0];

    // Create message
    const messageId = uuidv4();
    const result = await pool.query(
      `INSERT INTO chat_messages (id, order_id, sender_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [messageId, orderId, senderId, message]
    );

    // Create notification for recipient
    const recipientId = order.user_id === senderId 
      ? (await pool.query('SELECT user_id FROM runners WHERE id = $1', [order.runner_id])).rows[0]?.user_id
      : order.user_id;

    if (recipientId) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, message, type, order_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          recipientId,
          'New Message',
          `You have a new message regarding order ${order.order_number}.`,
          'chat',
          orderId,
        ]
      );
    }

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: {
        id: result.rows[0].id,
        orderId: result.rows[0].order_id,
        senderId: result.rows[0].sender_id,
        message: result.rows[0].message,
        isRead: result.rows[0].is_read,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM chat_messages m
      JOIN orders o ON m.order_id = o.id
      WHERE m.sender_id != $1 
        AND m.is_read = false
        AND (o.user_id = $1 OR o.runner_id IN (SELECT id FROM runners WHERE user_id = $1))
    `, [userId]);

    res.json({
      unreadCount: parseInt(result.rows[0].count),
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getUnreadCount,
};
