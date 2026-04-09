const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { sendTokenResponse } = require('../utils/jwt');

// ─── helpers ────────────────────────────────────────────────────────────────

const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = (otp) =>
  crypto.createHash('sha256').update(otp).digest('hex');

const OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
const COOLDOWN_MS   = 30 * 1000;            // 30 seconds
const MAX_ATTEMPTS  = 5;
const isOtpDebugEnabled =
  process.env.NODE_ENV === 'development' && process.env.OTP_DEV_DEBUG === 'true';

const otpEmailHtml = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff5f9; margin: 0; padding: 0; }
    .wrap { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #E84C7A, #d72c63); padding: 36px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 36px 32px; }
    .otp-box { background: #fdf2f5; border: 2px dashed #f4a5b9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp { font-size: 40px; font-weight: 800; color: #E84C7A; letter-spacing: 10px; }
    .note { color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0; }
    .warning { color: #9CA3AF; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #F3F4F6; }
    .footer { background: #fdf2f5; padding: 20px 32px; text-align: center; color: #9CA3AF; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🔐 Your Baby Mall Login Code</h1>
    </div>
    <div class="body">
      <p class="note">Use the code below to sign in to your Baby Mall account. It expires in <strong>5 minutes</strong>.</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
      </div>
      <p class="warning">⚠️ Do not share this code with anyone. Baby Mall will never ask for your OTP.</p>
    </div>
    <div class="footer">Baby Mall &nbsp;|&nbsp; Premium Baby Products &nbsp;|&nbsp; support@babymall.in</div>
  </div>
</body>
</html>
`;

// ─── controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/otp/request
 * Generate & send OTP
 */
exports.requestOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const email = req.body.email.toLowerCase().trim();

    // Determine if the user is new so the frontend can prompt for Name later
    const existingUser = await User.findOne({ email });
    const isNewUser = !existingUser;

    // 30-second cooldown: check for a recent OTP with lastSentAt < 30s ago
    const existing = await Otp.findOne({ email });
    if (existing) {
      const elapsed = Date.now() - new Date(existing.lastSentAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${wait} seconds before requesting another OTP.`,
          waitSeconds: wait,
        });
      }
      // Remove old OTP before creating a new one (invalidate previous)
      await Otp.deleteOne({ email });
    }

    // Generate OTP and hash it
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await Otp.create({ email, otpHash, expiresAt, lastSentAt: new Date() });

    // Send email (we let it throw error now to catch silent failures)
    await sendEmail({
      to: email,
      subject: 'Your Baby Mall Login Code',
      html: otpEmailHtml(otp),
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Valid for 5 minutes.`,
      isNewUser,
      otp: isOtpDebugEnabled ? otp : undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

/**
 * POST /api/auth/otp/verify
 * Verify OTP and return JWT
 */
exports.verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const email = req.body.email.toLowerCase().trim();
    const { otp, name } = req.body;

    const otpDoc = await Otp.findOne({ email });

    // OTP document does not exist or has been TTL-deleted
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Manual expiry guard (belt-and-suspenders alongside TTL)
    if (new Date() > new Date(otpDoc.expiresAt)) {
      await Otp.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Too many failed attempts
    if (otpDoc.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ email });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // Verify hash
    const incoming = hashOtp(otp);
    if (incoming !== otpDoc.otpHash) {
      // Increment attempts
      otpDoc.attempts += 1;
      await otpDoc.save();

      const remaining = MAX_ATTEMPTS - otpDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        attemptsRemaining: remaining,
      });
    }

    // OTP is valid – delete it immediately (prevent reuse)
    await Otp.deleteOne({ email });

    const ADMIN_EMAIL = 'jesil4202@gmail.com';
    const isAdminEmail = email === ADMIN_EMAIL;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        isActive: true,
        role: isAdminEmail ? 'admin' : 'user',
      });
    } else if (isAdminEmail && user.role !== 'admin') {
      // Ensure the admin email always has admin role (fixes existing accounts)
      user.role = 'admin';
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
