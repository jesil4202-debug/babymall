const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Admin dashboard stats (users + products + orders + revenue)
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueData] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.status(200).json({ 
      success: true, 
      totalUsers, 
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 12, search } = req.query;
    const query = { role: { $ne: 'admin' } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const users = await User.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    // Enrich with order stats
    const enriched = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.aggregate([
          { $match: { user: u._id } },
          { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$totalAmount' } } },
        ]);
        return {
          ...u.toObject(),
          ordersCount: orders[0]?.count || 0,
          totalSpent: orders[0]?.spent || 0,
        };
      })
    );

    res.status(200).json({ success: true, total, totalPages, customers: enriched, users: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(10);
    res.status(200).json({ success: true, user, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, isActive: user.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
