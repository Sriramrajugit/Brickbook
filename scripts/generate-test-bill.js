const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a canvas with bill information
const canvas = createCanvas(600, 400);
const ctx = canvas.getContext('2d');

// White background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 600, 400);

// Company header
ctx.font = 'bold 24px Arial';
ctx.fillStyle = '#1f2937';
ctx.fillText('Steel Suppliers Ltd', 50, 50);

ctx.font = '12px Arial';
ctx.fillStyle = '#6b7280';
ctx.fillText('123 Industrial Park, Mumbai', 50, 75);
ctx.fillText('Phone: +91-22-1234567', 50, 95);

// Divider
ctx.strokeStyle = '#e5e7eb';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(50, 110);
ctx.lineTo(550, 110);
ctx.stroke();

// Invoice details
ctx.font = 'bold 14px Arial';
ctx.fillStyle = '#1f2937';
ctx.fillText('INVOICE', 50, 140);

ctx.font = '12px Arial';
ctx.fillStyle = '#374151';
ctx.fillText('Invoice No: INV-STEEL-2026-005', 50, 165);
ctx.fillText('Date: 05/07/2026', 50, 190);
ctx.fillText('Due Date: 15/07/2026', 50, 215);

// Items section
ctx.font = 'bold 12px Arial';
ctx.fillText('Description', 50, 250);
ctx.fillText('Quantity', 300, 250);
ctx.fillText('Rate', 400, 250);
ctx.fillText('Amount', 480, 250);

ctx.strokeStyle = '#e5e7eb';
ctx.beginPath();
ctx.moveTo(50, 260);
ctx.lineTo(550, 260);
ctx.stroke();

// Item 1
ctx.font = '11px Arial';
ctx.fillStyle = '#374151';
ctx.fillText('Steel Rods (Grade A)', 50, 285);
ctx.fillText('100 kg', 300, 285);
ctx.fillText('₹500', 400, 285);
ctx.fillText('₹50,000', 480, 285);

// Item 2
ctx.fillText('Iron Sheets', 50, 310);
ctx.fillText('50 pcs', 300, 310);
ctx.fillText('₹1500', 400, 310);
ctx.fillText('₹75,000', 480, 310);

// Total
ctx.strokeStyle = '#e5e7eb';
ctx.beginPath();
ctx.moveTo(50, 330);
ctx.lineTo(550, 330);
ctx.stroke();

ctx.font = 'bold 14px Arial';
ctx.fillStyle = '#1f2937';
ctx.fillText('TOTAL AMOUNT', 350, 360);
ctx.fillText('₹1,25,000.00', 480, 360);

// Save to public folder
const publicDir = path.join(__dirname, 'public', 'test-bills');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(publicDir, 'test-bill.png'), buffer);

console.log('✅ Test bill image created: /public/test-bills/test-bill.png');
