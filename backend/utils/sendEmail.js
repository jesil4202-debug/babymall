const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];

/**
 * Send email using Brevo (Sendinblue) API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @returns {Promise<Object>} Email response
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    // DEBUG: Check environment variables
    console.log("🔍 BREVO_API_KEY:", process.env.BREVO_API_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("🔍 EMAIL_FROM:", process.env.EMAIL_FROM || "❌ Missing");

    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    // Set Brevo API key
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const emailFromRaw = process.env.EMAIL_FROM || 'noreply@babymall.com';
    
    // Parse email address from format: "Name <email@example.com>"
    const senderEmail = emailFromRaw.match(/<(.+?)>/)?.[1] || emailFromRaw;
    
    console.log(`📤 Sending email via Brevo API to: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From (raw): ${emailFromRaw}`);
    console.log(`   Parsed sender email: ${senderEmail}`);

    // Initialize Transactional Email API
    const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: senderEmail,
        name: "Baby Mall"
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    });

    if (!response || !response.messageId) {
      console.error('❌ Brevo API returned invalid response:', response);
      throw new Error('Brevo API returned invalid response');
    }

    console.log(`✅ Email sent successfully. Message ID: ${response.messageId}`);
    return response;

  } catch (error) {
    console.error('❌ Email send failed!');
    console.error('   Error:', error.message);
    console.error('   Recipient:', to);
    console.error('   Subject:', subject);
    
    // DEBUG: Log full Brevo response
    console.error("🔴 BREVO FULL ERROR:", JSON.stringify(error.response?.body || error, null, 2));

    // Provide helpful debugging info
    if (error.message.includes('BREVO_API_KEY')) {
      console.error('\n⚠️  BREVO API KEY MISSING:');
      console.error('   Add BREVO_API_KEY to environment variables');
      console.error('   Get your API key from: https://app.brevo.com/settings/account/api');
    }

    if (error.message.includes('unauthorized') || error.message.includes('invalid')) {
      console.error('\n⚠️  INVALID BREVO API KEY:');
      console.error('   Check your BREVO_API_KEY value');
      console.error('   Make sure it starts with "xkeysib-"');
    }

    if (error.message.includes('from') || error.message.includes('sender')) {
      console.error('\n⚠️  SENDER EMAIL ERROR:');
      console.error('   Verify EMAIL_FROM is set correctly');
      console.error('   Must be a verified sender in Brevo');
    }

    throw new Error('Failed to send email via Brevo API');
  }
};

module.exports = { sendEmail };
