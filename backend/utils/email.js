const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];

/**
 * Send email using Brevo (Sendinblue) API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML email body
 * @returns {Promise<Object>} Email response with ID
 * @throws {Error} If email sending fails
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    // DEBUG: Check environment variables
    console.log("🔍 BREVO_API_KEY:", process.env.BREVO_API_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("🔍 EMAIL_FROM:", process.env.EMAIL_FROM || "❌ Missing");

    // Validate required environment variables
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    // Set Brevo API key
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const emailFromRaw = process.env.EMAIL_FROM || 'noreply@babymall.com';

    // Parse email address from format: "Name <email@example.com>"
    const senderEmail = emailFromRaw.match(/<(.+?)>/)?.[1] || emailFromRaw;

    console.log(`📧 Sending email via Brevo API`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From (raw): ${emailFromRaw}`);
    console.log(`   Parsed sender email: ${senderEmail}`);

    // Initialize Transactional Email API
    const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    // Send email using Brevo API
    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: senderEmail,
        name: "Baby Mall"
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    });

    // Verify response has required data
    if (!response || !response.messageId) {
      console.error('❌ Invalid response from Brevo API:', response);
      throw new Error('Brevo API returned invalid response');
    }

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${response.messageId}`);

    return response;

  } catch (error) {
    console.error('❌ Email sending failed!');
    console.error('   Error Message:', error.message);
    console.error('   Recipient:', to);
    console.error('   Subject:', subject);

    // DEBUG: Log full Brevo response
    console.error("🔴 BREVO FULL ERROR:", JSON.stringify(error.response?.body || error, null, 2));

    // Log detailed troubleshooting info
    if (error.message.includes('BREVO_API_KEY')) {
      console.error('\n⚠️  TROUBLESHOOTING: Missing BREVO_API_KEY');
      console.error('   → Set BREVO_API_KEY in environment variables');
      console.error('   → Get API key from: https://app.brevo.com/settings/account/api');
    }

    if (error.message.includes('unauthorized') || error.message.includes('invalid')) {
      console.error('\n⚠️  TROUBLESHOOTING: Invalid API Key');
      console.error('   → Check BREVO_API_KEY value');
      console.error('   → Ensure it starts with "xkeysib-"');
      console.error('   → Try generating a new key from Brevo dashboard');
    }

    if (error.message.includes('from') || error.message.includes('sender')) {
      console.error('\n⚠️  TROUBLESHOOTING: Invalid Sender Email');
      console.error('   → Verify EMAIL_FROM is set correctly');
      console.error('   → Must be a verified sender in Brevo');
    }

    // Re-throw the error for calling code to handle
    throw new Error(`Failed to send email: ${error.message}`);
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
  orderConfirmationTemplate,
  shippingUpdateTemplate,
  abandonedCartTemplate,
};
