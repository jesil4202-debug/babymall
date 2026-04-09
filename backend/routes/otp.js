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

// 🔧 DEBUG ENDPOINT: Verify email configuration (Dev/Staging only)
router.get('/debug/test-email', async (req, res) => {
  // Optional: Add IP whitelist for security
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Debug endpoint disabled in production' });
  }

  try {
    const { initializeTransporter } = require('../utils/email');
    const transporter = initializeTransporter();

    // Test email connection
    console.log('🔧 Testing email configuration...');
    const verification = await transporter.verify();

    if (verification) {
      console.log('✅ Email configuration is valid');
      return res.status(200).json({
        success: true,
        message: 'Email configuration is valid and working!',
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          from: process.env.EMAIL_FROM,
        },
      });
    } else {
      console.log('❌ Email configuration failed verification');
      return res.status(400).json({
        success: false,
        message: 'Email configuration verification failed. Check SMTP credentials.',
      });
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify email configuration',
      hint: 'Check that EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS are set correctly in environment variables',
    });
  }
});

router.post('/request', otpRequestLimiter, requestValidation, requestOtp);
router.post('/verify', verifyValidation, verifyOtp);

module.exports = router;
