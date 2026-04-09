const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @returns {Promise<Object>} Email response
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const emailFrom = process.env.EMAIL_FROM || 'noreply@babymall.com';
    
    console.log(`📤 Sending email via Resend to: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${emailFrom}`);

    const response = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error('❌ Resend API error:', response.error);
      throw new Error(`Resend API error: ${response.error.message}`);
    }

    console.log(`✅ Email sent successfully. ID: ${response.data.id}`);
    return response.data;

  } catch (error) {
    console.error('❌ Email send failed!');
    console.error('   Error:', error.message);
    console.error('   Recipient:', to);
    console.error('   Subject:', subject);

    // Provide helpful debugging info
    if (error.message.includes('RESEND_API_KEY')) {
      console.error('\n⚠️  RESEND API KEY MISSING:');
      console.error('   Add RESEND_API_KEY to environment variables');
      console.error('   Get your API key from: https://resend.com/api-keys');
    }

    if (error.message.includes('unauthorized') || error.message.includes('invalid')) {
      console.error('\n⚠️  INVALID RESEND API KEY:');
      console.error('   Check your RESEND_API_KEY value');
      console.error('   Make sure it starts with "re_"');
    }

    if (error.message.includes('from')) {
      console.error('\n⚠️  SENDER EMAIL ERROR:');
      console.error('   Verify EMAIL_FROM is set correctly');
      console.error('   Must be a verified Resend sender domain');
    }

    throw new Error('Failed to send email via Resend API');
  }
};

module.exports = { sendEmail };
