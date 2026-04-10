const express = require('express');
const router = express.Router();
const generateInvoice = require('../utils/invoiceGenerator');
const Order = require('../models/Order');
const { protect: auth } = require('../middleware/auth');

/**
 * @route   GET /api/invoice/:id
 * @desc    Download invoice PDF for an order
 * @access  Private (User who owns the order)
 * @param   {String} id - Order ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    console.log(`📥 Invoice Download Request - Order: ${id}, User: ${userId}`);

    // Fetch order with user details populated
    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .lean();

    // Validation: Order exists
    if (!order) {
      console.log(`❌ Order not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Security: Only owner can download invoice
    if (order.user._id.toString() !== userId) {
      console.log(`❌ Authorization denied - Order owner: ${order.user._id}, Request user: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this invoice',
      });
    }

    console.log(`✅ Authorization passed - Invoice generating for ${order.user.email}`);

    // Security: Only paid orders can be invoiced (optional - can be removed for draft invoices)
    // Uncomment the line below if you want to enforce payment before invoice download
    // if (order.payment?.status !== 'paid') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invoice is only available for paid orders',
    //   });
    // }

    // Generate and stream PDF
    generateInvoice(order, res);
  } catch (err) {
    console.error('❌ Invoice error:', err);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
