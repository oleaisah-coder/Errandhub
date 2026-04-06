const express = require('express');
const router = express.Router();
const { authenticate, requireUser } = require('../middleware/auth');
const { createOrderValidation, updateOrderStatusValidation } = require('../middleware/validation');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
} = require('../controllers/orderController');

// All order routes require authentication
router.use(authenticate);

router.post('/', requireUser, createOrderValidation, createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatusValidation, updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/rate', rateOrder);

module.exports = router;
