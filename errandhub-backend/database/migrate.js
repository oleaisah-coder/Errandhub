require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Running database migration...\n');

    // 1. Create wallets table
    console.log('Creating wallets table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        balance DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  wallets table ready\n');

    // 2. Add new columns to payments table (if not exist)
    console.log('Migrating payments table...');

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

    // 3. Generate reference values for existing rows that have none
    await pool.query(`
      UPDATE payments
      SET reference = CONCAT('ERH-MIGRATED-', id)
      WHERE reference IS NULL
    `);

    // 4. Add UNIQUE constraint on reference (safely)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payments_reference_key'
        ) THEN
          ALTER TABLE payments ADD CONSTRAINT payments_reference_key UNIQUE (reference);
        END IF;
      END $$;
    `);

    // 5. Add NOT NULL constraint to reference once all rows have one
    await pool.query(`
      ALTER TABLE payments ALTER COLUMN reference SET NOT NULL
    `);

    console.log('  payments table migrated\n');

    // 6. Create wallets for existing users that don't have one
    console.log('Ensuring wallets for existing users...');
    const usersResult = await pool.query('SELECT id FROM users');
    for (const user of usersResult.rows) {
      await pool.query(`
        INSERT INTO wallets (id, user_id, balance)
        VALUES (gen_random_uuid(), $1, 0)
        ON CONFLICT (user_id) DO NOTHING
      `, [user.id]);
    }
    console.log(`  Wallets created for ${usersResult.rows.length} users\n`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
