const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log(`⚠️  No token provided for ${req.method} ${req.path}`);
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      console.log(`❌ User not found - Token ID: ${decoded.id}`);
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (!req.user.isActive) {
      console.log(`❌ Account deactivated - User: ${req.user.email}`);
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }
    console.log(`✅ JWT verified - User: ${req.user.email} (${req.user.role})`);
    next();
  } catch {
    console.log(`❌ JWT verification failed`);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`,
      });
    }

    // Role-based authorization only. Admin role is set in database and verified on login.
    next();
  };
};
