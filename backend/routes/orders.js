const express = require('express');
const router = express.Router();
const {
  createOrder, createRazorpayOrder, verifyRazorpayPayment,
  getMyOrders, getOrder, getAllOrders, updateOrderStatus,
  downloadInvoice, getSalesAnalytics,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', createOrder);
router.post('/razorpay/create', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.get('/my', getMyOrders);
router.get('/analytics', authorize('admin'), getSalesAnalytics);
router.get('/', authorize('admin'), getAllOrders);
router.get('/:id', getOrder);
router.get('/:id/invoice', downloadInvoice);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
