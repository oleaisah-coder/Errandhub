const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function updateAdminPassword() {
  try {
    const newEmail = 'Oleaisah@gmail.com';
    const newPassword = 'Theophilus';
    const oldEmail = 'admin@errandhub.com';
    const saltRounds = 12;
    
    console.log(`Updating admin account from ${oldEmail} to ${newEmail}...`);
    
    const hash = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await pool.query(
      'UPDATE users SET email = $1, password_hash = $2 WHERE email = $3 RETURNING id',
      [newEmail, hash, oldEmail]
    );
    
    if (result.rows.length > 0) {
      console.log(`Successfully updated admin password! User ID: ${result.rows[0].id}`);
    } else {
      console.error('Error: Admin user not found in database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
