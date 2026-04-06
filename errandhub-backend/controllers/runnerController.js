const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// Get available tasks for runners
const getAvailableTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'estimatedPrice', oi.estimated_price
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items,
        json_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'phone', u.phone
        ) as user
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status = 'confirmed' AND o.runner_id IS NULL
      GROUP BY o.id, u.id
      ORDER BY o.is_emergency DESC, o.created_at ASC
    `);

    res.json({
      tasks: result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        errandType: order.errand_type,
        items: order.items || [],
        pickupAddress: order.pickup_address,
        pickupCity: order.pickup_city,
        pickupState: order.pickup_state,
        deliveryAddress: order.delivery_address,
        deliveryCity: order.delivery_city,
        deliveryState: order.delivery_state,
        totalAmount: order.total_amount,
        isEmergency: order.is_emergency,
        user: order.user,
        createdAt: order.created_at,
      })),
    });
  } catch (error) {
    console.error('Get available tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my assigned tasks
const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get runner ID
    const runnerResult = await pool.query(
      'SELECT id FROM runners WHERE user_id = $1',
      [userId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    const runnerId = runnerResult.rows[0].id;

    const result = await pool.query(`
      SELECT o.*, 
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'estimatedPrice', oi.estimated_price,
            'actualPrice', oi.actual_price
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items,
        json_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'phone', u.phone,
          'address', u.address
        ) as user
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.runner_id = $1 AND o.status != 'delivered' AND o.status != 'cancelled'
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `, [runnerId]);

    res.json({
      tasks: result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        errandType: order.errand_type,
        status: order.status,
        items: order.items || [],
        pickupAddress: order.pickup_address,
        pickupCity: order.pickup_city,
        pickupState: order.pickup_state,
        deliveryAddress: order.delivery_address,
        deliveryCity: order.delivery_city,
        deliveryState: order.delivery_state,
        totalAmount: order.total_amount,
        notes: order.notes,
        user: order.user,
        createdAt: order.created_at,
      })),
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept task
const acceptTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get runner ID
    const runnerResult = await pool.query(
      'SELECT id FROM runners WHERE user_id = $1',
      [userId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    const runnerId = runnerResult.rows[0].id;

    // Atomically claim the task — prevents race condition where two runners accept simultaneously
    const orderResult = await pool.query(
      `UPDATE orders 
       SET runner_id = $1, status = 'runner_assigned', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND status = 'confirmed' AND runner_id IS NULL
       RETURNING *`,
      [runnerId, id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not available or already accepted by another runner' });
    }

    const order = orderResult.rows[0];

    // Update runner availability
    await pool.query(
      'UPDATE runners SET is_available = false WHERE id = $1',
      [runnerId]
    );

    // Create notification for user
    const runnerUserResult = await pool.query(
      'SELECT u.first_name, u.last_name FROM runners r JOIN users u ON r.user_id = u.id WHERE r.id = $1',
      [runnerId]
    );
    const runnerName = runnerUserResult.rows[0];

    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        order.user_id,
        'Runner Assigned',
        `${runnerName.first_name} ${runnerName.last_name} has accepted your order.`,
        'order',
        id,
      ]
    );

    res.json({ message: 'Task accepted successfully' });
  } catch (error) {
    console.error('Accept task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualPrices, location } = req.body;
    const userId = req.user.id;

    // Get runner ID
    const runnerResult = await pool.query(
      'SELECT id FROM runners WHERE user_id = $1',
      [userId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    const runnerId = runnerResult.rows[0].id;

    // Check if order belongs to this runner
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND runner_id = $2',
      [id, runnerId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const order = orderResult.rows[0];

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
      
      // Make runner available again
      await pool.query(
        'UPDATE runners SET is_available = true, total_deliveries = total_deliveries + 1 WHERE id = $1',
        [runnerId]
      );
    }

    params.push(id);

    await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${params.length}`,
      params
    );

    // Update runner location if provided
    if (location && location.lat && location.lng) {
      await pool.query(
        'UPDATE runners SET current_location_lat = $1, current_location_lng = $2 WHERE id = $3',
        [location.lat, location.lng, runnerId]
      );
    }

    // Create notification for user
    const statusMessages = {
      runner_assigned: 'A runner has been assigned to your order.',
      item_purchased: 'Your items have been purchased.',
      on_the_way: 'Your order is on the way!',
      delivered: 'Your order has been delivered.',
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

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get task history (completed tasks)
const getTaskHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get runner ID
    const runnerResult = await pool.query(
      'SELECT id FROM runners WHERE user_id = $1',
      [userId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    const runnerId = runnerResult.rows[0].id;

    const result = await pool.query(`
      SELECT o.*, 
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'estimatedPrice', oi.estimated_price,
            'actualPrice', oi.actual_price
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items,
        json_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name
        ) as user
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.runner_id = $1 AND o.status = 'delivered'
      GROUP BY o.id, u.id
      ORDER BY o.delivered_at DESC
    `, [runnerId]);

    res.json({
      tasks: result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        errandType: order.errand_type,
        items: order.items || [],
        deliveryAddress: order.delivery_address,
        totalAmount: order.total_amount,
        rating: order.rating,
        user: order.user,
        deliveredAt: order.delivered_at,
      })),
    });
  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get runner profile
const getRunnerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT r.*, u.first_name, u.last_name, u.email, u.phone
      FROM runners r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    const runner = result.rows[0];

    // Get earnings stats
    const earningsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_earnings,
        COUNT(*) as total_deliveries
      FROM orders o
      WHERE o.runner_id = $1 AND o.status = 'delivered'
    `, [runner.id]);

    const stats = earningsResult.rows[0];

    res.json({
      profile: {
        id: runner.id,
        firstName: runner.first_name,
        lastName: runner.last_name,
        email: runner.email,
        phone: runner.phone,
        vehicleType: runner.vehicle_type,
        licensePlate: runner.license_plate,
        isAvailable: runner.is_available,
        rating: runner.rating,
        totalDeliveries: runner.total_deliveries,
        currentLocation: runner.current_location_lat ? {
          lat: runner.current_location_lat,
          lng: runner.current_location_lng,
        } : null,
      },
      stats: {
        totalEarnings: parseFloat(stats.total_earnings),
        totalDeliveries: parseInt(stats.total_deliveries),
      },
    });
  } catch (error) {
    console.error('Get runner profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update runner availability
const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable } = req.body;

    const result = await pool.query(
      'UPDATE runners SET is_available = $1 WHERE user_id = $2 RETURNING *',
      [isAvailable, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    res.json({
      message: `You are now ${isAvailable ? 'online' : 'offline'}`,
      isAvailable: result.rows[0].is_available,
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload receipt
const uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get runner ID
    const runnerResult = await pool.query(
      'SELECT id FROM runners WHERE user_id = $1',
      [userId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Runner profile not found' });
    }

    const runnerId = runnerResult.rows[0].id;

    // Check if order belongs to this runner
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND runner_id = $2',
      [id, runnerId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Save receipt
    const imageUrl = `/uploads/receipts/${req.file.filename}`;

    await pool.query(
      `INSERT INTO receipts (id, order_id, image_url, uploaded_by)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), id, imageUrl, userId]
    );

    res.json({
      message: 'Receipt uploaded successfully',
      receiptUrl: imageUrl,
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAvailableTasks,
  getMyTasks,
  acceptTask,
  updateTaskStatus,
  getTaskHistory,
  getRunnerProfile,
  updateAvailability,
  uploadReceipt,
};
