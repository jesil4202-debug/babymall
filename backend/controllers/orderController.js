const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendEmail, orderConfirmationTemplate, shippingUpdateTemplate } = require('../utils/email');
const { generateInvoice } = require('../utils/invoice');
const { calculateTotals } = require('../utils/calculateTotals');
const fs = require('fs');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, coupon } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items.' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    const cartItems = cart?.items || [];

    // Trust backend snapshot values (cart/model) over any frontend payload values.
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }
      
      const matchedCartItem = cartItems.find((cartItem) => {
        const sameProduct = cartItem.product.toString() === item.product;
        const sameVariant = (cartItem.variant?.label || '') === (item.variant?.label || '');
        return sameProduct && sameVariant;
      });

      const price = matchedCartItem?.price ?? item.variant?.price ?? product.price;
      const deliveryCharge = matchedCartItem?.deliveryCharge ?? product.deliveryCharge ?? 0;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price,
        deliveryCharge,
        quantity: item.quantity,
        variant: item.variant,
      });
    }

    // Recalculate totals backend-side strictly based on orderItems payload we just built
    const { subtotal: itemsTotal, deliveryTotal: deliveryCharge, totalAmount: strictTotal } = calculateTotals(orderItems);

    const discount = 0; // Apply coupon logic here
    const totalAmount = strictTotal - discount;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      deliveryCharge,
      discount,
      totalAmount,
    });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Clear cart (if they still have one)
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // If COD — send confirmation email
    if (paymentMethod === 'cod') {
      try {
        await sendEmail({
          to: req.user.email,
          subject: `Order Confirmed! #${order.orderNumber} — Baby Mall`,
          html: orderConfirmationTemplate(order, req.user),
        });
      } catch (e) {
        console.error('Email failed:', e.message);
      }
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Create Razorpay order
// @route   POST /api/orders/razorpay/create
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order: razorpayOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/razorpay/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        'payment.razorpayOrderId': razorpayOrderId,
        'payment.razorpayPaymentId': razorpayPaymentId,
        'payment.razorpaySignature': razorpaySignature,
        'payment.status': 'paid',
        'payment.paidAt': new Date(),
        deliveryStatus: 'confirmed',
      },
      { new: true }
    ).populate('user', 'name email');

    try {
      await sendEmail({
        to: order.user.email,
        subject: `Payment Confirmed! #${order.orderNumber} — Baby Mall`,
        html: orderConfirmationTemplate(order, order.user),
      });
    } catch (e) {
      console.error('Email failed:', e.message);
    }

    res.status(200).json({ success: true, message: 'Payment verified.', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Admin: Get all orders
// @route   GET /api/orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.deliveryStatus = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name email');

    res.status(200).json({ success: true, total, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Admin: Update order status
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { deliveryStatus, trackingNumber, courierName } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        deliveryStatus,
        ...(trackingNumber && { trackingNumber }),
        ...(courierName && { courierName }),
        ...(deliveryStatus === 'delivered' && { deliveredAt: new Date() }),
        ...(deliveryStatus === 'cancelled' && { cancelledAt: new Date() }),
      },
      { new: true }
    ).populate('user', 'name email');

    // Send shipping update email
    try {
      await sendEmail({
        to: order.user.email,
        subject: `Order Update #${order.orderNumber} — Baby Mall`,
        html: shippingUpdateTemplate(order, order.user),
      });
    } catch (e) {
      console.error('Email failed:', e.message);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Download invoice
// @route   GET /api/orders/:id/invoice
exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filepath = await generateInvoice(order, req.user);
    res.download(filepath, `Invoice_${order.orderNumber}.pdf`, () => {
      fs.unlink(filepath, () => {});
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Admin: Sales analytics
// @route   GET /api/orders/analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
    ]);

    // Last 7 days revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, 'payment.status': 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus,
        dailyRevenue,
        topProducts,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
