/**
 * INVOICE SYSTEM - CODE EXAMPLES & INTEGRATION GUIDE
 * 
 * This file demonstrates how to use the invoice system
 * in various scenarios within your Baby Mall app.
 */

// ============================================================
// 1. FRONTEND: Basic Invoice Download
// ============================================================

// Option A: Direct download function
const downloadInvoice = (orderId: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  window.open(`${apiUrl}/api/invoice/${orderId}`, '_blank');
};

// Usage:
// <button onClick={() => downloadInvoice(order._id)}>
//   Download Invoice
// </button>

// ============================================================
// Option B: Using the custom hook (from useInvoiceDownload.ts)
// ============================================================

import { useInvoiceDownload } from '@/lib/useInvoiceDownload';

export default function OrderCard() {
  const { downloadInvoice } = useInvoiceDownload(process.env.NEXT_PUBLIC_API_URL!);
  
  return (
    <button onClick={() => downloadInvoice(orderId, orderNumber)}>
      Download Invoice
    </button>
  );
}

// ============================================================
// 2. FRONTEND: Conditional Display (Only show for paid orders)
// ============================================================

export default function OrderActions({ order }: { order: any }) {
  const canDownloadInvoice = order.payment?.status === 'paid';
  
  return (
    <div>
      {canDownloadInvoice ? (
        <button 
          onClick={() => window.open(
            `${process.env.NEXT_PUBLIC_API_URL}/api/invoice/${order._id}`,
            '_blank'
          )}
        >
          📄 Download Invoice
        </button>
      ) : (
        <span className="text-gray-400">Invoice available after payment</span>
      )}
    </div>
  );
}

// ============================================================
// 3. BACKEND: API Route Flow
// ============================================================

/**
 * Route: GET /api/invoice/:id
 * 
 * Flow:
 * 1. User clicks "Download Invoice" button
 * 2. Browser sends GET request with auth token
 * 3. Auth middleware verifies JWT token
 * 4. Route fetches order from database
 * 5. Verifies user owns this order
 * 6. Generates PDF using pdfkit
 * 7. Streams PDF to browser
 * 8. Browser prompts download dialog
 */

// Example request:
// GET /api/invoice/6507a1b2c3d4e5f6g7h8i9j0
// Headers: { Authorization: 'Bearer your-jwt-token' }

// Example response:
// Status: 200
// Content-Type: application/pdf
// Content-Disposition: attachment; filename=invoice-BM000001.pdf
// [PDF binary data]

// ============================================================
// 4. CUSTOMIZE: Update Invoice Header
// ============================================================

// File: backend/utils/invoiceGenerator.js (Lines 18-26)

const doc = new PDFDocument({ margin: 40 });

// Update your company details:
const COMPANY_CONFIG = {
  name: 'Baby Mall',           // Change to your company name
  tagline: 'Premium Baby Products',
  city: 'Palakkad',
  state: 'Kerala',
  country: 'India',
  email: 'support@babymall.com',
  phone: '+91-XXX-XXXX-XXX',
  website: 'www.babymall.com'  // Optional
};

// Then use in invoice:
doc
  .fontSize(14)
  .font('Helvetica-Bold')
  .text(COMPANY_CONFIG.name, 320, 40, { align: 'right' })
  .fontSize(10)
  .font('Helvetica')
  .text(`${COMPANY_CONFIG.city}, ${COMPANY_CONFIG.state}`, 320, 72, { align: 'right' })
  .text(`📧 ${COMPANY_CONFIG.email} | 📞 ${COMPANY_CONFIG.phone}`, 320, 86, { align: 'right' });

// ============================================================
// 5. CUSTOMIZE: Add Custom Invoice Number Format
// ============================================================

// Your Order model already generates orderNumber like: BM000001
// The invoice uses this automatically:

// Option A: Use orderNumber (current)
const fileName = `invoice-${order.orderNumber}.pdf`;  // invoice-BM000001.pdf

// Option B: Add custom prefix
const fileName = `INV-${order.orderNumber}-${new Date().getFullYear()}.pdf`;  // INV-BM000001-2026.pdf

// Option C: Use timestamp
const timeStamp = Date.now();
const fileName = `invoice-${timeStamp}.pdf`;  // invoice-1712752200000.pdf

// Update in invoiceGenerator.js, line 7:
res.setHeader(
  'Content-Disposition',
  `attachment; filename=invoice-${order.orderNumber || order._id.toString().slice(-8)}.pdf`
);

// ============================================================
// 6. ADMIN FEATURE: Resend Invoice Email
// ============================================================

// You can add this function to send invoice via email:

async function sendInvoiceEmail(orderId: string) {
  try {
    // Fetch order
    const order = await Order.findById(orderId).populate('user');
    
    // Generate invoice PDF (in-memory)
    const pdfBuffer = await generateInvoicePDF(order);
    
    // Send via Brevo (your current email service)
    await brevoAPI.emails.send({
      to: [{ email: order.user.email, name: order.user.name }],
      subject: `Invoice for Order ${order.orderNumber}`,
      html: `<p>Your invoice is attached below.</p>`,
      attachment: [{
        content: pdfBuffer,
        name: `invoice-${order.orderNumber}.pdf`,
        type: 'application/pdf'
      }]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

// ============================================================
// 7. SECURITY: Add Payment Status Check
// ============================================================

// File: backend/routes/invoice.js
// Uncomment lines 28-33 to enforce paid status:

if (order.payment?.status !== 'paid') {
  return res.status(400).json({
    success: false,
    message: 'Invoice is only available for paid orders',
  });
}

// This prevents COD orders from generating invoices before payment

// ============================================================
// 8. TESTING: Manual Invoice Generation
// ============================================================

// Create a test script: backend/test-invoice.js

const mongoose = require('mongoose');
const generateInvoice = require('./utils/invoiceGenerator');
const Order = require('./models/Order');

async function testInvoice() {
  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find a test order
  const order = await Order.findOne().populate('user');
  
  if (!order) {
    console.log('No orders found');
    return;
  }
  
  // Create mock response object
  const mockRes = {
    setHeader: (key, val) => console.log(`Header: ${key} = ${val}`),
    pipe: () => {},
    end: () => console.log('PDF generated successfully')
  };
  
  // Generate invoice
  generateInvoice(order, mockRes);
  
  console.log('Test complete');
}

testInvoice().catch(console.error);

// Run with: node backend/test-invoice.js

// ============================================================
// 9. ADVANCED: Generate Multiple Invoices (Bulk)
// ============================================================

async function generateBulkInvoices(orderIds: string[]) {
  const invoices = [];
  
  for (const orderId of orderIds) {
    try {
      const order = await Order.findById(orderId).populate('user');
      
      if (!order) continue;
      
      // Generate PDF (would need async version of generateInvoice)
      const pdfBuffer = await generateInvoicePDF(order);
      
      invoices.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        fileName: `invoice-${order.orderNumber}.pdf`,
        buffer: pdfBuffer,
        size: pdfBuffer.length
      });
    } catch (error) {
      console.error(`Failed to generate invoice for ${orderId}:`, error);
    }
  }
  
  return invoices;
}

// Usage:
// const invoices = await generateBulkInvoices(['id1', 'id2', 'id3']);
// invoices.forEach(inv => console.log(`${inv.fileName}: ${inv.size} bytes`));

// ============================================================
// 10. DEPLOYMENT CHECKLIST
// ============================================================

/**
 * Before deploying to production:
 * 
 * Backend:
 * ✅ invoiceGenerator.js created
 * ✅ invoice.js route created
 * ✅ Route registered in server.js
 * ✅ pdfkit dependency installed
 * ✅ Auth middleware configured
 * ✅ Logo added to assets/ folder (optional)
 * ✅ Company details updated
 * ✅ Error handling tested
 * 
 * Frontend:
 * ✅ useInvoiceDownload.ts created
 * ✅ Download buttons added to order pages
 * ✅ Order list page updated
 * ✅ Order details page updated
 * ✅ Admin dashboard updated
 * ✅ NEXT_PUBLIC_API_URL environment variable set
 * ✅ Tested on mobile browsers
 * 
 * Testing:
 * ✅ Create test order
 * ✅ Download invoice as user
 * ✅ Verify PDF content
 * ✅ Check PDF styling
 * ✅ Test on slow connection
 * ✅ Verify auth rejection for unauthorized users
 * 
 * Monitoring:
 * ✅ Monitor invoice generation time
 * ✅ Track PDF generation errors
 * ✅ Monitor memory usage
 * ✅ Check download traffic
 */

// ============================================================
// 11. FUTURE ENHANCEMENTS
// ============================================================

/**
 * Ideas to extend the invoice system:
 * 
 * 1. Invoice Email Automation
 *    - Send invoice when order is shipped
 *    - Send reminder invoice if not downloaded
 * 
 * 2. Digital Signature
 *    - Add company signature/seal to PDF
 *    - Add digital certificate
 * 
 * 3. Invoice Archive
 *    - Store generated PDFs in S3/storage
 *    - Archive for compliance
 * 
 * 4. Multi-Language
 *    - Generate invoices in different languages
 *    - Based on user locale
 * 
 * 5. Custom Templates
 *    - Multiple invoice styles
 *    - Seasonal templates
 *    - Brand customization
 * 
 * 6. Tax Compliance
 *    - Add GST/Tax details
 *    - Tax ID numbers
 *    - Compliance signatures
 * 
 * 7. Recurring/Subscription
 *    - Monthly invoice generation
 *    - Billing cycle tracking
 * 
 * 8. Analytics
 *    - Track invoice downloads
 *    - Track print events
 *    - User behavior
 */

// ============================================================
// END OF EXAMPLES
// ============================================================

export { downloadInvoice };
