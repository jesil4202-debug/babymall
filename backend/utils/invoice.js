const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = (order, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `invoice_${order.orderNumber}.pdf`;
    const filepath = path.join(__dirname, '../tmp', filename);

    // Ensure tmp directory exists
    if (!fs.existsSync(path.join(__dirname, '../tmp'))) {
      fs.mkdirSync(path.join(__dirname, '../tmp'), { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#F02899');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('Baby Mall', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Premium Baby Products', 50, 52);
    doc.fillColor('#333').fontSize(10).text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 25, { align: 'right' });
    doc.text(`Invoice #: INV-${order.orderNumber}`, 400, 40, { align: 'right' });

    doc.moveDown(3);

    // Billing Info
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#F02899').text('BILLED TO:', 50, 100);
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text(user.name, 50, 118);
    doc.text(user.email, 50, 133);
    doc.text(`${order.shippingAddress.street}`, 50, 148);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 50, 163);

    // Order Info
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#F02899').text('ORDER DETAILS:', 350, 100);
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text(`Order #: ${order.orderNumber}`, 350, 118);
    doc.text(`Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}`, 350, 133);
    doc.text(`Status: ${order.deliveryStatus.replace(/_/g, ' ')}`, 350, 148);

    // Table header
    const tableTop = 210;
    doc.rect(50, tableTop, 495, 26).fill('#FFF0F7');
    doc.fillColor('#F02899').fontSize(10).font('Helvetica-Bold');
    doc.text('ITEM', 60, tableTop + 8);
    doc.text('QTY', 330, tableTop + 8);
    doc.text('PRICE', 390, tableTop + 8);
    doc.text('TOTAL', 460, tableTop + 8);

    // Table rows
    let y = tableTop + 36;
    doc.fillColor('#333').font('Helvetica').fontSize(9);
    order.items.forEach((item) => {
      doc.text(item.name.substring(0, 40), 60, y);
      doc.text(item.quantity.toString(), 330, y);
      doc.text(`₹${item.price.toLocaleString()}`, 390, y);
      doc.text(`₹${(item.price * item.quantity).toLocaleString()}`, 460, y);
      doc.moveTo(50, y + 18).lineTo(545, y + 18).strokeColor('#FFE4F3').stroke();
      y += 26;
    });

    // Totals
    y += 10;
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    doc.text('Subtotal:', 390, y);
    doc.text(`₹${order.itemsTotal.toLocaleString()}`, 460, y);
    y += 18;
    doc.text('Delivery Charges:', 390, y);
    doc.text(`₹${(order.deliveryCharge || 0).toLocaleString()}`, 460, y);
    y += 18;
    if (order.discount > 0) {
      doc.fillColor('#43A047').text('Discount:', 390, y);
      doc.text(`-₹${order.discount.toLocaleString()}`, 460, y);
      y += 18;
    }
    doc.rect(385, y, 160, 28).fill('#F02899');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', 395, y + 8);
    doc.text(`₹${order.totalAmount.toLocaleString()}`, 455, y + 8);

    // Footer
    doc.fillColor('#999').fontSize(9).font('Helvetica');
    doc.text('Thank you for shopping at Baby Mall!', 50, doc.page.height - 60, { align: 'center' });
    doc.text('support@babymall.in | www.babymall.in', 50, doc.page.height - 45, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

module.exports = { generateInvoice };
