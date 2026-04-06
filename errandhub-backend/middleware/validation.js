const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// Auth validations
const signupValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('role').optional().isIn(['user', 'runner']).withMessage('Role must be user or runner'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Order validations
const createOrderValidation = [
  body('errandType').notEmpty().withMessage('Errand type is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('totalAmount').isNumeric().withMessage('Total amount is required'),
  handleValidationErrors,
];

const updateOrderStatusValidation = [
  param('id').notEmpty().withMessage('Order ID is required'),
  body('status').isIn(['pending', 'confirmed', 'runner_assigned', 'item_purchased', 'on_the_way', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

// Profile validation
const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  handleValidationErrors,
];



module.exports = {
  handleValidationErrors,
  signupValidation,
  loginValidation,
  createOrderValidation,
  updateOrderStatusValidation,
  updateProfileValidation,
};
