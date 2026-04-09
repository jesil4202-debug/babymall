const express = require('express');
const router = express.Router();
const { getAllUsers, getUserDetails, toggleUserStatus, getDashboardStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Dashboard stats
router.get('/stats', getDashboardStats);

// Users / Customers
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', toggleUserStatus);

// Alias routes for frontend compatibility
router.get('/customers', getAllUsers);
router.get('/customers/:id', getUserDetails);
router.put('/customers/:id/status', toggleUserStatus);

module.exports = router;
