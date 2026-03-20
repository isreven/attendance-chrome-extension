const { createCanvas } = require('canvas');
const fs = require('fs');

// Create 920x680 large promotional tile
const width = 920;
const height = 680;

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
ctx.font = 'bold 56px Arial';
ctx.textAlign = 'center';
ctx.fillText('SAP Synerion', width / 2, 140);

// Subtitle
ctx.font = 'bold 42px Arial';
ctx.fillText('Attendance Updater', width / 2, 200);

// Icon
ctx.font = 'bold 120px Arial';
ctx.fillText('🏠', width / 2, 360);

// Features
ctx.font = '24px Arial';
ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
ctx.fillText('⚡ One-Click Updates', width / 2, 480);
ctx.fillText('🎯 Custom Date Builder', width / 2, 520);
ctx.fillText('💾 Auto-Save', width / 2, 560);

// Tagline
ctx.font = 'italic 20px Arial';
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
ctx.fillText('Automate Your Attendance in Seconds', width / 2, 630);

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('promo-tile-large.png', buffer);
console.log('✓ Created promo-tile-large.png (920x680)');
