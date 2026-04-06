const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMessages,
  sendMessage,
  getUnreadCount,
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticate);

router.get('/unread-count', getUnreadCount);
router.get('/:orderId', getMessages);
router.post('/:orderId', sendMessage);

module.exports = router;
