const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { requestOtp, verifyOtp } = require('../controllers/otpController');

// Rate limiter: max 5 OTP requests per hour per email/IP
const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => `${req.body?.email || ''}_${rateLimit.ipKeyGenerator(req)}`,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
});

// Validation rules
const requestValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
];

const verifyValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('otp')
    .isNumeric()
    .withMessage('OTP must be numeric.')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits.'),
];

router.post('/request', otpRequestLimiter, requestValidation, requestOtp);
router.post('/verify', verifyValidation, verifyOtp);

module.exports = router;
