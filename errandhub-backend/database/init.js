const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema (CREATE TABLE IF NOT EXISTS)
    await pool.query(schema);
    
    // Run column-level migrations for existing tables
    const columns = [
      { name: 'currency', def: 'VARCHAR(10) DEFAULT \'NGN\'' },
      { name: 'reference', def: 'VARCHAR(100)' },
      { name: 'flutterwave_id', def: 'VARCHAR(100)' },
      { name: 'payment_type', def: 'VARCHAR(20)' },
      { name: 'payment_method', def: 'VARCHAR(20)' },
      { name: 'metadata', def: 'JSONB' },
      { name: 'updated_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ];

    for (const col of columns) {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'payments' AND column_name = '${col.name}'
          ) THEN
            ALTER TABLE payments ADD COLUMN ${col.name} ${col.def};
            RAISE NOTICE 'Added column %', '${col.name}';
          END IF;
        END $$;
      `);
    }

    // Generate reference values for existing rows that have none
    await pool.query(`
      UPDATE payments SET reference = CONCAT('ERH-MIGRATED-', id) WHERE reference IS NULL
    `);

    // Add UNIQUE constraint on reference (safely)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_reference_key') THEN
          ALTER TABLE payments ADD CONSTRAINT payments_reference_key UNIQUE (reference);
        END IF;
      END $$;
    `);

    await pool.query(`ALTER TABLE payments ALTER COLUMN reference SET NOT NULL`);

    // Ensure wallets for existing users
    const usersResult = await pool.query('SELECT id FROM users');
    for (const user of usersResult.rows) {
      await pool.query(`
        INSERT INTO wallets (id, user_id, balance)
        VALUES (gen_random_uuid(), $1, 0)
        ON CONFLICT (user_id) DO NOTHING
      `, [user.id]);
    }
    console.log(`  Wallets created for ${usersResult.rows.length} users\n`);
    
    console.log('Database schema created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
