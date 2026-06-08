const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const {
  getWallet,
  initializeWalletFunding,
  verifyTransaction,
  deductFromWallet,
  initializeOrderPayment,
} = require('../controllers/paymentController');

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/wallet', authenticate, getWallet);

router.post('/initialize-wallet', authenticate, paymentLimiter, initializeWalletFunding);

router.post('/initialize-order', authenticate, paymentLimiter, initializeOrderPayment);

router.post('/verify', authenticate, paymentLimiter, verifyTransaction);

router.post('/deduct', authenticate, paymentLimiter, deductFromWallet);

module.exports = router;
