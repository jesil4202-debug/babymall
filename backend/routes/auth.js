const express = require('express');
const router = express.Router();
const {
  logout, getMe, updateProfile,
  addAddress, updateAddress, deleteAddress, toggleWishlist,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Legacy password auth removed. Use /api/auth/otp/*

// ── Active routes ─────────────────────────────────────────────────────────────
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Addresses
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Wishlist
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
