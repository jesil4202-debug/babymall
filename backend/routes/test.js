const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/sendEmail');

/**
 * TEST ENDPOINT: Send a test email via Brevo
 * GET /api/test-email
 * Useful for debugging Brevo API configuration
 */
router.get('/test-email', async (req, res) => {
  try {
    console.log('\n🧪 TEST EMAIL ROUTE INITIATED');
    console.log('━'.repeat(60));

    // Send test email
    await sendEmail({
      to: "test@example.com",
      subject: "Baby Mall - Brevo Email Test",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 500px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; }
            h2 { color: #E84C7A; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>✅ Brevo Test Email Success!</h2>
            <p>If you received this email, Brevo API is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        </body>
        </html>
      `
    });

    console.log('━'.repeat(60));
    console.log('✅ TEST EMAIL SENT SUCCESSFULLY\n');

    res.json({
      success: true,
      message: "✅ Test email sent successfully via Brevo",
      timestamp: new Date().toISOString(),
      recipient: "test@example.com"
    });

  } catch (error) {
    console.error('━'.repeat(60));
    console.error('❌ TEST EMAIL FAILED');
    console.error('TEST ERROR DETAILS:', error.message);
    console.error('━'.repeat(60) + '\n');

    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      hint: "Check console logs for full Brevo error details"
    });
  }
});

module.exports = router;
