const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateInvoice = (order, res) => {
  try {
    const doc = new PDFDocument({ margin: 40 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${order.orderNumber || order._id}.pdf`
    );

    doc.pipe(res);

    // ============================================================
    // HEADER SECTION - Logo & Company Info
    // ============================================================

    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 80 });
    } else {
      // Placeholder: Draw a simple rectangle if logo doesn't exist
      doc
        .rect(40, 40, 80, 80)
        .stroke();
      doc
        .fontSize(8)
        .text('LOGO', 40, 70, { width: 80, align: 'center' });
    }

    // Company Details (Right aligned)
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Baby Mall', 320, 40, { align: 'right' })
      .fontSize(10)
      .font('Helvetica')
      .text('Premium Baby Products', 320, 58, { align: 'right' })
      .text('Palakkad, Kerala, India', 320, 72, { align: 'right' })
      .text('📧 support@babymall.com | 📞 +91-XXX-XXXX-XXX', 320, 86, { align: 'right' });

    // ============================================================
    // INVOICE TITLE & ORDER INFO
    // ============================================================

    doc
      .moveTo(40, 140)
      .lineTo(555, 140)
      .stroke();

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('INVOICE', 40, 150);

    // Order details in 2 columns
    doc
      .fontSize(9)
      .font('Helvetica');

    // Left column
    doc
      .text('Order Number:', 40, 180)
      .font('Helvetica-Bold')
      .text(order.orderNumber || order._id.toString().slice(-8), 40, 193)
      .font('Helvetica')
      .text('Issue Date:', 40, 210)
      .font('Helvetica-Bold')
      .text(new Date(order.createdAt).toLocaleDateString('en-IN'), 40, 223)
      .font('Helvetica')
      .text('Payment Status:', 40, 240)
      .font('Helvetica-Bold')
      .text((order.payment?.status || 'pending').toUpperCase(), 40, 253);

    // Right column
    doc
      .font('Helvetica')
      .text('Payment Method:', 320, 180)
      .font('Helvetica-Bold')
      .text((order.paymentMethod || 'N/A').toUpperCase(), 320, 193)
      .font('Helvetica')
      .text('Delivery Status:', 320, 210)
      .font('Helvetica-Bold')
      .text((order.deliveryStatus || 'placed').toUpperCase().replace(/_/g, ' '), 320, 223)
      .font('Helvetica')
      .text('Tracking:', 320, 240)
      .font('Helvetica-Bold')
      .text(order.trackingNumber || 'Not available', 320, 253);

    // ============================================================
    // CUSTOMER & SHIPPING INFO
    // ============================================================

    doc
      .moveTo(40, 280)
      .lineTo(555, 280)
      .stroke();

    // Customer Info (Left)
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('BILL TO:', 40, 295)
      .fontSize(9)
      .font('Helvetica')
      .text(order.user?.name || 'Customer', 40, 312)
      .text(`Phone: ${order.user?.phone || 'N/A'}`, 40, 325)
      .text(`Email: ${order.user?.email || 'N/A'}`, 40, 338);

    // Shipping Address (Right)
    const addr = order.shippingAddress;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('SHIP TO:', 320, 295)
      .fontSize(9)
      .font('Helvetica')
      .text(addr?.name || 'N/A', 320, 312, { width: 235 })
      .text(`${addr?.street || ''}`, 320, 325, { width: 235 })
      .text(`${addr?.city || ''}, ${addr?.state || ''} ${addr?.pincode || ''}`, 320, 338, { width: 235 });

    // ============================================================
    // ITEMS TABLE
    // ============================================================

    const tableTop = 390;
    const colX = { item: 40, qty: 400, price: 450, total: 520 };
    const colWidth = { item: 360, qty: 50, price: 70, total: 50 };

    // Table Header
    doc
      .moveTo(40, tableTop - 10)
      .lineTo(555, tableTop - 10)
      .stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('ITEM', colX.item, tableTop)
      .text('QTY', colX.qty, tableTop)
      .text('PRICE', colX.price, tableTop)
      .text('TOTAL', colX.total, tableTop);

    doc
      .moveTo(40, tableTop + 15)
      .lineTo(555, tableTop + 15)
      .stroke();

    // Table Rows
    let y = tableTop + 25;
    const rowHeight = 25;
    let itemCount = 0;

    order.items.forEach((item) => {
      const itemTotal = item.quantity * item.price;

      doc
        .font('Helvetica')
        .fontSize(9)
        .text(item.name, colX.item, y, { width: colWidth.item, ellipsis: true })
        .text(item.quantity.toString(), colX.qty, y, { align: 'center' })
        .text(`₹${item.price.toLocaleString('en-IN')}`, colX.price, y, { align: 'right' })
        .text(`₹${itemTotal.toLocaleString('en-IN')}`, colX.total, y, { align: 'right' });

      y += rowHeight;
      itemCount++;
    });

    doc
      .moveTo(40, y)
      .lineTo(555, y)
      .stroke();

    // ============================================================
    // TOTALS SECTION
    // ============================================================

    y += 15;

    const summaryX = 400;
    const summaryLabelWidth = 100;
    const summaryValueX = 500;

    doc
      .fontSize(9)
      .font('Helvetica');

    // Subtotal
    doc
      .text('Subtotal:', summaryX, y, { width: summaryLabelWidth })
      .text(`₹${order.itemsTotal.toLocaleString('en-IN')}`, summaryValueX, y, {
        align: 'right',
        width: 50,
      });

    y += 15;

    // Delivery Charge
    if (order.deliveryCharge > 0) {
      doc
        .text('Delivery Charge:', summaryX, y, { width: summaryLabelWidth })
        .text(`₹${order.deliveryCharge.toLocaleString('en-IN')}`, summaryValueX, y, {
          align: 'right',
          width: 50,
        });

      y += 15;
    }

    // Discount
    if (order.discount > 0) {
      doc
        .text('Discount:', summaryX, y, { width: summaryLabelWidth })
        .font('Helvetica-Bold')
        .text(`-₹${order.discount.toLocaleString('en-IN')}`, summaryValueX, y, {
          align: 'right',
          width: 50,
        })
        .font('Helvetica');

      y += 15;
    }

    // Total Amount - Bold
    y += 5;
    doc
      .moveTo(400, y)
      .lineTo(555, y)
      .stroke();

    y += 10;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('TOTAL:', summaryX, y, { width: summaryLabelWidth })
      .text(`₹${order.totalAmount.toLocaleString('en-IN')}`, summaryValueX, y, {
        align: 'right',
        width: 50,
      });

    // ============================================================
    // FOOTER SECTION
    // ============================================================

    const footerY = 700;

    doc
      .moveTo(40, footerY)
      .lineTo(555, footerY)
      .stroke();

    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Thank you for shopping with Baby Mall! 🍼', 40, footerY + 15, {
        align: 'center',
        width: 515,
      })
      .text('For support, contact us at support@babymall.com', 40, footerY + 28, {
        align: 'center',
        width: 515,
        color: '#666666',
      });

    doc
      .fontSize(8)
      .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, footerY + 45, {
        align: 'center',
        width: 515,
        color: '#999999',
      });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ message: 'Error generating invoice', error: error.message });
  }
};

module.exports = generateInvoice;
