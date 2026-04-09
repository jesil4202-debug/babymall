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

// 🔧 DEBUG ENDPOINT: Verify Resend API configuration (Dev/Staging only)
router.get('/debug/test-email', async (req, res) => {
  // Optional: Add IP whitelist for security
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Debug endpoint disabled in production' });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'RESEND_API_KEY environment variable is not set',
        hint: 'Add RESEND_API_KEY to your environment variables. Get it from https://resend.com/api-keys'
      });
    }

    if (!process.env.EMAIL_FROM) {
      return res.status(400).json({
        success: false,
        message: 'EMAIL_FROM environment variable is not set',
        hint: 'Add EMAIL_FROM to your environment variables. Use a verified domain or onboarding@resend.dev for testing'
      });
    }

    console.log('🔧 Testing Resend API configuration...');
    console.log('   RESEND_API_KEY: Set ✓');
    console.log('   EMAIL_FROM:', process.env.EMAIL_FROM);

    return res.status(200).json({
      success: true,
      message: 'Resend API configuration is valid!',
      config: {
        apiKeySet: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM,
        provider: 'Resend',
      },
    });

  } catch (error) {
    console.error('❌ Resend API test failed:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify Resend configuration',
      hint: 'Check that RESEND_API_KEY and EMAIL_FROM are set correctly in environment variables',
    });
  }
});

router.post('/request', otpRequestLimiter, requestValidation, requestOtp);
router.post('/verify', verifyValidation, verifyOtp);

module.exports = router;
