const { pool } = require('./config/database');
require('dotenv').config();

async function checkColumns() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
    `);
    console.log('Orders table columns:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking columns:', err);
    process.exit(1);
  }
}
checkColumns();
