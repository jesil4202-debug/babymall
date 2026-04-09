const nodemailer = require('nodemailer');

// ✅ LAZY LOAD: Create transporter only when needed & verify env vars
let transporter = null;
let transporterInitError = null;

const initializeTransporter = () => {
  // Return existing transporter if already initialized
  if (transporter) return transporter;
  if (transporterInitError) throw transporterInitError;

  // Validate required env vars
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    transporterInitError = new Error(
      `❌ EMAIL CONFIG ERROR: Missing environment variables: ${missing.join(', ')}\n` +
      `   On Render dashboard: Go to Environment and add:\n` +
      `   EMAIL_HOST=smtp.gmail.com\n` +
      `   EMAIL_PORT=587\n` +
      `   EMAIL_USER=your-email@gmail.com\n` +
      `   EMAIL_PASS=your-16-char-app-password\n` +
      `   EMAIL_FROM=your-email@gmail.com`
    );
    throw transporterInitError;
  }

  console.log('📧 Initializing Nodemailer transporter...');
  console.log('   Host:', process.env.EMAIL_HOST);
  console.log('   Port:', process.env.EMAIL_PORT);
  console.log('   User:', process.env.EMAIL_USER);
  console.log('   From:', process.env.EMAIL_FROM);

  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: false, // Use TLS (not SSL) for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // ✅ Render optimization: Enable connection pooling
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      },
      // ✅ Gmail: Increase timeout for slower cloud connections
      connectionTimeout: 5000,
      socketTimeout: 10000,
    });

    console.log('✅ Nodemailer transporter initialized successfully');
    return transporter;
  } catch (error) {
    transporterInitError = error;
    console.error('❌ Failed to create transporter:', error.message);
    throw error;
  }
};

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };
  
  try {
    console.log(`📤 Sending email to: ${to}, Subject: ${subject}`);
    
    // Initialize transporter if needed
    const mailer = initializeTransporter();
    
    const info = await mailer.sendMail(mailOptions);
    console.log(`✅ Email sent successfully. MessageID: ${info.messageId}`);
    return info;
    
  } catch (err) {
    console.error('❌ Email send failed!');
    console.error('   Error:', err.message);
    console.error('   Recipients:', mailOptions.to);
    console.error('   Subject:', mailOptions.subject);
    
    // Provide helpful troubleshooting for common Gmail issues
    if (err.message.includes('Invalid login') || err.message.includes('Authentication failed')) {
      console.error('\n⚠️  GMAIL AUTHENTICATION ERROR - Check:');
      console.error('   1. Is user email correct? (must be Gmail with 2FA enabled)');
      console.error('   2. Is app password correct? (16 chars, NOT your Gmail password)');
      console.error('   3. Has Gmail blocked unusual sign-in activity from Render IP?');
      console.error('   → Go to: https://myaccount.google.com/security');
      console.error('   → Check "Allow less secure apps" or use app password');
    }
    
    if (err.message.includes('getaddrinfo') || err.message.includes('connect ETIMEDOUT')) {
      console.error('\n⚠️  NETWORK/DNS ERROR:');
      console.error('   1. Verify EMAIL_HOST is correct (smtp.gmail.com)');
      console.error('   2. Check if Render has internet access');
      console.error('   3. Render may need to be on a paid plan for outbound SMTP');
    }
    
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

const orderConfirmationTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #fff5f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #F02899, #e91e8c); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; }
    .body { padding: 32px; }
    .order-box { background: #FFF0F7; border: 1px solid #FFD6EC; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #FFE4F3; }
    .item:last-child { border-bottom: none; }
    .total { font-size: 18px; font-weight: 700; color: #F02899; margin-top: 16px; }
    .footer { text-align: center; padding: 24px; background: #FFF5F9; color: #999; font-size: 13px; }
    .btn { display: inline-block; background: #F02899; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for shopping at Baby Mall</p>
    </div>
    <div class="body">
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your order has been placed successfully! Here's a summary:</p>
      <div class="order-box">
        <p><strong>Order #${order.orderNumber}</strong></p>
        ${order.items.map(item => `
          <div class="item">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        `).join('')}
        <div class="total">Total: ₹${order.totalAmount.toLocaleString()}</div>
      </div>
      <p><strong>Shipping to:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</p>
      <center><a href="${process.env.FRONTEND_URL}/account/orders/${order._id}" class="btn">Track your Order</a></center>
    </div>
    <div class="footer">
      <p>Baby Mall | Premium Baby Products | support@babymall.in</p>
    </div>
  </div>
</body>
</html>
`;

const shippingUpdateTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f5f9ff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1E88E5, #1565C0); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .body { padding: 32px; }
    .status-badge { display: inline-block; background: #E3F2FD; color: #1E88E5; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
    .btn { display: inline-block; background: #1E88E5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; padding: 24px; background: #f5f9ff; color: #999; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Shipping Update</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> status has been updated:</p>
      <p><span class="status-badge">${order.deliveryStatus.replace(/_/g, ' ').toUpperCase()}</span></p>
      ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
      ${order.courierName ? `<p><strong>Courier:</strong> ${order.courierName}</p>` : ''}
      <center><a href="${process.env.FRONTEND_URL}/account/orders/${order._id}" class="btn">Track Order</a></center>
    </div>
    <div class="footer">
      <p>Baby Mall | Premium Baby Products</p>
    </div>
  </div>
</body>
</html>
`;

const abandonedCartTemplate = (user, cartItems) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #fff5f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #F02899, #AB47BC); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .body { padding: 32px; }
    .btn { display: inline-block; background: #F02899; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; padding: 24px; background: #fff5f9; color: #999; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 You left something behind!</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your little ones are waiting! You have items in your cart that haven't been checked out yet.</p>
      <center><a href="${process.env.FRONTEND_URL}/cart" class="btn">Complete Your Purchase</a></center>
    </div>
    <div class="footer">
      <p>Baby Mall | Premium Baby Products</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  sendEmail,
  initializeTransporter,
  orderConfirmationTemplate,
  shippingUpdateTemplate,
  abandonedCartTemplate,
};
