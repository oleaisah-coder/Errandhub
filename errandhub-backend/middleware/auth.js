const { createClient } = require('@supabase/supabase-js');
const { pool } = require('../config/database');

let supabase;
const jwt = require('jsonwebtoken');

const getSupabase = () => {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('CRITICAL: Missing Supabase environment variables in backend');
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  return supabase;
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '7d',
  });
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    let userId;

    // First attempt to verify as a Supabase token
    const client = getSupabase();
    if (client) {
      const { data: supaData, error: supaError } = await client.auth.getUser(token);
      if (!supaError && supaData?.user) {
        userId = supaData.user.id;
      }
    }

    // If Supabase failed or skipped, try local verify
    if (!userId) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        userId = decoded.sub || decoded.id; 
      } catch (err) {
        console.error('Invalid JWT token:', err.message);
        return res.status(401).json({ error: 'Invalid token or session expired' });
      }
    }

    // Sync with local users table to get role and extra info
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, phone, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found in system.' });
    } else {
      req.user = result.rows[0];
    }
    
    if (!req.user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

const requireRunner = (req, res, next) => {
  if (req.user.role !== 'runner' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Runner only.' });
  }
  next();
};

const requireUser = (req, res, next) => {
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireRunner,
  requireUser,
  generateToken,
};
