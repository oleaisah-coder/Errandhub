const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Standard PostgreSQL Pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false,
};

let pool;

// MOCK DATABASE INTERCEPTOR (Offline Mode Backup)
// Helper to pre-hash passwords for the mock users so authController.js validations pass perfectly
function createMockUser(id, firstName, email, password, role) {
  return {
    id,
    first_name: firstName,
    last_name: 'Demo',
    email: email,
    password_hash: bcrypt.hashSync(password, 10),
    phone: '+2348000000000',
    role: role,
    is_active: true,
    address: '123 Mock Street',
    city: 'Mock City',
    state: 'Mock State',
    avatar_url: null,
    created_at: new Date()
  };
}

const mockUsers = [
  createMockUser('1111-user-id', 'John', 'user@errandhub.com', 'user123', 'user'),
  createMockUser('2222-admin-id', 'Admin', 'Oleaisah@gmail.com', 'Theophilus', 'admin'),
  createMockUser('3333-runner-id', 'Alice', 'runner@errandhub.com', 'runner123', 'runner')
];

const mockPool = {
  query: async (text, params) => {
    const queryStr = typeof text === 'string' ? text.toLowerCase() : text.text ? text.text.toLowerCase() : '';
    
    if (queryStr.includes('from users where email')) {
      const email = params[0];
      const user = mockUsers.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }

    if (queryStr.includes('from users where id')) {
      const id = params[0];
      const user = mockUsers.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }

    if (queryStr.includes('insert into orders')) {
      return { 
        rows: [{ 
          id: params[0] || 'mock-order-uuid', 
          order_number: params[1] || 'ORD-MOCK-1', 
          user_id: params[2] || 'mock-user', 
          errand_type: params[3] || 'grocery', 
          status: params[4] || 'pending',
          pickup_address: params[5] || '', 
          pickup_city: params[6] || '', 
          pickup_state: params[7] || '',
          delivery_address: params[8] || '', 
          delivery_city: params[9] || '', 
          delivery_state: params[10] || '',
          item_fee: params[11] || 0, 
          delivery_fee: params[12] || 0, 
          service_fee: params[13] || 0, 
          total_amount: params[14] || 0,
          created_at: new Date()
        }] 
      };
    }

    if (queryStr.includes('insert into') || queryStr.includes('update ')) {
      return { rows: [{ id: 'mock-uuid-response', success: true }] };
    }

    return { rows: [] };
  },
  connect: async () => {
    return {
      query: mockPool.query,
      release: () => {},
    };
  },
  on: (event, callback) => {
    if (event === 'connect' && !process.env.DATABASE_URL) {
      console.log('Intercepted PostgreSQL connection! Running completely offline in MOCK DATA mode.');
    }
  }
};

// Decide whether to use real Pool or Mock
if (process.env.DATABASE_URL) {
  console.log('PostgreSQL connection string detected. Attempting to connect to Supabase...');
  pool = new Pool(poolConfig);
  
  pool.on('connect', () => {
    console.log('Successfully connected to the PostgreSQL database.');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
  });
} else {
  console.warn('WARNING: No DATABASE_URL found in .env. Falling back to MOCK DATA MODE.');
  pool = mockPool;
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
  mockUsers, // Exported for seeding purposes
};
