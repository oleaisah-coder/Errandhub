const { pool } = require('../config/database');

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = `
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
          'email', u.email,
          'phone', u.phone
        ) as user,
        json_build_object(
          'id', r.id,
          'firstName', ru.first_name,
          'lastName', ru.last_name,
          'phone', ru.phone
        ) as runner
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN runners r ON o.runner_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.order_number ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    query += `
      GROUP BY o.id, u.id, r.id, ru.first_name, ru.last_name, ru.phone
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM orders' + (status ? ' WHERE status = $1' : ''),
      status ? [status] : []
    );

    res.json({
      orders: result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        runnerId: order.runner_id,
        errandType: order.errand_type,
        status: order.status,
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
        deliveredAt: order.delivered_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: order.items || [],
        user: order.user,
        runner: order.runner?.id ? order.runner : null,
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT id, first_name, last_name, email, phone, role, is_active, created_at
      FROM users
      WHERE 1=1
    `;

    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (email ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`;
    }

    query += `
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    if (role) {
      countParams.push(role);
      countQuery += ` AND role = $${countParams.length}`;
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all runners (admin only)
const getAllRunners = async (req, res) => {
  try {
    const { isAvailable, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT r.*, 
        u.first_name, u.last_name, u.email, u.phone
      FROM runners r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (isAvailable !== undefined) {
      params.push(isAvailable === 'true');
      query += ` AND r.is_available = $${params.length}`;
    }

    query += `
      ORDER BY r.rating DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      runners: result.rows.map(runner => ({
        id: runner.id,
        userId: runner.user_id,
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
      })),
    });
  } catch (error) {
    console.error('Get all runners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order price (admin only)
const updateOrderPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemFee, deliveryFee, serviceFee } = req.body;

    const totalAmount = (itemFee || 0) + (deliveryFee || 0) + (serviceFee || 0);

    const result = await pool.query(
      `UPDATE orders 
       SET item_fee = $1, delivery_fee = $2, service_fee = $3, total_amount = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [itemFee, deliveryFee, serviceFee, totalAmount, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order price updated successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Update order price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard statistics (admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Total orders
    const totalOrdersResult = await pool.query('SELECT COUNT(*) FROM orders');
    const totalOrders = parseInt(totalOrdersResult.rows[0].count);

    // Orders by status
    const ordersByStatusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);
    const ordersByStatus = ordersByStatusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Total revenue
    const revenueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE status = 'delivered'
    `);
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Today's revenue
    const todayRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE status = 'delivered' AND DATE(delivered_at) = CURRENT_DATE
    `);
    const todayRevenue = parseFloat(todayRevenueResult.rows[0].total);

    // Total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']);
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Total runners
    const totalRunnersResult = await pool.query('SELECT COUNT(*) FROM runners');
    const totalRunners = parseInt(totalRunnersResult.rows[0].count);

    // Available runners
    const availableRunnersResult = await pool.query(
      'SELECT COUNT(*) FROM runners WHERE is_available = true'
    );
    const availableRunners = parseInt(availableRunnersResult.rows[0].count);

    // Recent orders
    const recentOrdersResult = await pool.query(`
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        totalOrders,
        ordersByStatus,
        totalRevenue,
        todayRevenue,
        totalUsers,
        totalRunners,
        availableRunners,
      },
      recentOrders: recentOrdersResult.rows,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle user active status (admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        isActive: user.is_active,
      },
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get payments (admin only)
const getPayments = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, o.order_number, u.first_name, u.last_name, u.email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    query += `
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      payments: result.rows,
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllOrders,
  getAllUsers,
  getAllRunners,
  updateOrderPrice,
  getDashboardStats,
  toggleUserStatus,
  getPayments,
};
