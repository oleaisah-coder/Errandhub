const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllOrders,
  getAllUsers,
  getAllRunners,
  updateOrderPrice,
  toggleUserStatus,
  getPayments,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/dashboard-stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/users', getAllUsers);
router.get('/runners', getAllRunners);
router.put('/orders/:id/price', updateOrderPrice);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/payments', getPayments);

module.exports = router;
