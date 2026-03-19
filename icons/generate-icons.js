const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [
  { size: 16, fontSize: 11, label: 'A' },
  { size: 48, fontSize: 32, label: 'A' },
  { size: 128, fontSize: 88, label: 'A' }
];

sizes.forEach(({ size, fontSize, label }) => {
  console.log(`Creating ${size}x${size} icon...`);

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - SAP blue color
  ctx.fillStyle = '#0070f3';
  ctx.fillRect(0, 0, size, size);

  // Add rounded corners effect with a slightly darker border
  ctx.strokeStyle = '#0051cc';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  // Text - white "A" for Attendance
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, size / 2, size / 2);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon-${size}.png`, buffer);
  console.log(`✓ Created icon-${size}.png`);
});

console.log('\n✅ All icons created successfully!');
