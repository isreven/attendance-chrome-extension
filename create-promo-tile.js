const { createCanvas } = require('canvas');
const fs = require('fs');

// Create 440x280 promotional tile
const width = 440;
const height = 280;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background gradient - SAP blue
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#0070f3');
gradient.addColorStop(1, '#0051cc');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Title
ctx.fillStyle = 'white';
ctx.font = 'bold 36px Arial';
ctx.textAlign = 'center';
ctx.fillText('SAP Synerion', width / 2, 80);

// Subtitle
ctx.font = 'bold 28px Arial';
ctx.fillText('Attendance Updater', width / 2, 120);

// Icon/Badge
ctx.font = 'bold 64px Arial';
ctx.fillText('🏠', width / 2, 190);

// Tagline
ctx.font = '18px Arial';
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.fillText('One-Click Attendance Automation', width / 2, 240);

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('promo-tile-small.png', buffer);
console.log('✓ Created promo-tile-small.png (440x280)');
