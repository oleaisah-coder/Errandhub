const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticate, requireRunner } = require('../middleware/auth');
const {
  getAvailableTasks,
  getMyTasks,
  acceptTask,
  updateTaskStatus,
  getTaskHistory,
  getRunnerProfile,
  updateAvailability,
  uploadReceipt,
} = require('../controllers/runnerController');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'receipts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  },
});

// All runner routes require authentication + runner role
router.use(authenticate, requireRunner);

router.get('/profile', getRunnerProfile);
router.put('/availability', updateAvailability);
router.get('/available-tasks', getAvailableTasks);
router.get('/my-tasks', getMyTasks);
router.get('/task-history', getTaskHistory);
router.post('/tasks/:id/accept', acceptTask);
router.put('/tasks/:id/status', updateTaskStatus);
router.post('/tasks/:id/receipt', upload.single('receipt'), uploadReceipt);

module.exports = router;
