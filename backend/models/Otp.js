const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Stored as SHA-256 hash
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    // Timestamp of last OTP sent (for 30-sec cooldown check)
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index – MongoDB automatically deletes documents after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
