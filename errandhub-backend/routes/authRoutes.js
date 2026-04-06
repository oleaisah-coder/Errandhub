const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { signupValidation, loginValidation, updateProfileValidation } = require('../middleware/validation');
const {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
