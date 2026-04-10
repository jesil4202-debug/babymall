const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    addresses: user.addresses,
    wishlist: user.wishlist,
  };

  console.log(`✅ Login Successful - User: ${user.email}, Role: ${user.role}`);
  console.log(`🔑 Token generated: ${token.substring(0, 30)}...`);
  if (user.role === 'admin') {
    console.log(`🔒 Admin Access Granted: ${user.email}`);
  }

  const responsePayload = {
    success: true,
    token,
    user: userData,
  };

  console.log(`📤 Response payload:`, JSON.stringify({
    success: responsePayload.success,
    token: responsePayload.token ? `${responsePayload.token.substring(0, 30)}...` : 'MISSING',
    user: responsePayload.user.email,
  }));

  res.status(statusCode).cookie('token', token, cookieOptions).json(responsePayload);
};

module.exports = { generateToken, sendTokenResponse };
