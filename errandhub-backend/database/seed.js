const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const SALT_ROUNDS = 12;

// Helper function to hash password with bcrypt
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Create admin user
    const adminId = uuidv4();
    await pool.query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, phone, role, address, city, state)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO NOTHING
    `, [
      adminId, 'Admin', 'User', 'Oleaisah@gmail.com', 
      await hashPassword('Theophilus'), '+2348011111111', 'admin',
      '123 Admin Street', 'Lagos', 'Lagos'
    ]);
    console.log('Admin user created');

    // Create test user
    const userId = uuidv4();
    await pool.query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, phone, role, address, city, state)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO NOTHING
    `, [
      userId, 'John', 'Doe', 'user@errandhub.com',
      await hashPassword('user123'), '+2348022222222', 'user',
      '45 Residential Ave', 'Lagos', 'Lagos'
    ]);
    console.log('Test user created');

    // Create runner user
    const runnerUserId = uuidv4();
    await pool.query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, phone, role, address, city, state)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO NOTHING
    `, [
      runnerUserId, 'Alice', 'Smith', 'runner@errandhub.com',
      await hashPassword('runner123'), '+2348033333333', 'runner',
      '78 Runner Street', 'Lagos', 'Lagos'
    ]);
    console.log('Runner user created');

    // Create runner profile
    const runnerId = uuidv4();
    await pool.query(`
      INSERT INTO runners (id, user_id, vehicle_type, license_plate, is_available, rating, total_deliveries)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [
      runnerId, runnerUserId, 'Motorcycle', 'LAG-123-XY', true, 4.8, 156
    ]);
    console.log('Runner profile created');

    // Create sample orders
    const orderId1 = uuidv4();
    await pool.query(`
      INSERT INTO orders (id, order_number, user_id, runner_id, errand_type, status, 
        pickup_address, pickup_city, pickup_state,
        delivery_address, delivery_city, delivery_state,
        item_fee, delivery_fee, service_fee, total_amount, notes, is_emergency, rating, review, delivered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `, [
      orderId1, 'ORD001', userId, runnerId, 'grocery', 'delivered',
      'Shoprite Ikeja', 'Lagos', 'Lagos',
      '45 Residential Ave', 'Lagos', 'Lagos',
      7000, 2000, 1500, 10500, 'Please get fresh vegetables', false,
      5, 'Excellent service! Very fast delivery.', new Date('2024-03-01')
    ]);

    // Add order items
    await pool.query(`
      INSERT INTO order_items (id, order_id, name, quantity, estimated_price, actual_price)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [uuidv4(), orderId1, 'Rice (5kg)', 1, 5000, 4800]);
    
    await pool.query(`
      INSERT INTO order_items (id, order_id, name, quantity, estimated_price, actual_price)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [uuidv4(), orderId1, 'Vegetable Oil', 2, 2000, 1900]);

    // Create active order
    const orderId2 = uuidv4();
    await pool.query(`
      INSERT INTO orders (id, order_number, user_id, runner_id, errand_type, status, 
        pickup_address, pickup_city, pickup_state,
        delivery_address, delivery_city, delivery_state,
        item_fee, delivery_fee, service_fee, total_amount, is_emergency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      orderId2, 'ORD002', userId, runnerId, 'food', 'on_the_way',
      'Chicken Republic', 'Lagos', 'Lagos',
      '45 Residential Ave', 'Lagos', 'Lagos',
      6000, 1500, 1200, 8700, false
    ]);

    await pool.query(`
      INSERT INTO order_items (id, order_id, name, quantity, estimated_price)
      VALUES ($1, $2, $3, $4, $5)
    `, [uuidv4(), orderId2, 'Jollof Rice & Chicken', 2, 6000]);

    // Create payment for completed order
    await pool.query(`
      INSERT INTO payments (id, order_id, user_id, amount, payment_method, status, paid_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [uuidv4(), orderId1, userId, 10500, 'card', 'completed', new Date('2024-03-01')]);

    // Create notifications
    await pool.query(`
      INSERT INTO notifications (id, user_id, title, message, type, order_id, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [uuidv4(), userId, 'Order Delivered', 'Your order ORD001 has been delivered successfully.', 'order', orderId1, true]);

    await pool.query(`
      INSERT INTO notifications (id, user_id, title, message, type, order_id, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [uuidv4(), userId, 'Runner Assigned', 'A runner has been assigned to your order ORD002.', 'order', orderId2, false]);

    // Create chat messages
    await pool.query(`
      INSERT INTO chat_messages (id, order_id, sender_id, message, is_read)
      VALUES ($1, $2, $3, $4, $5)
    `, [uuidv4(), orderId2, runnerUserId, 'Hello! I have picked up your order and am on my way.', true]);

    await pool.query(`
      INSERT INTO chat_messages (id, order_id, sender_id, message, is_read)
      VALUES ($1, $2, $3, $4, $5)
    `, [uuidv4(), orderId2, userId, 'Great! Thank you so much.', true]);

    console.log('Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Admin: Oleaisah@gmail.com / Theophilus');
    console.log('User: user@errandhub.com / user123');
    console.log('Runner: runner@errandhub.com / runner123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
