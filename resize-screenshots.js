const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = './screenshots';
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 800;

async function resizeScreenshots() {
  const files = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));

  console.log(`Found ${files.length} screenshots to resize...\n`);

  for (const file of files) {
    const inputPath = path.join(SCREENSHOTS_DIR, file);
    const outputPath = path.join(SCREENSHOTS_DIR, file);

    console.log(`Processing ${file}...`);

    try {
      await sharp(inputPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toFile(outputPath + '.temp');

      // Replace original
      fs.renameSync(outputPath + '.temp', outputPath);
      console.log(`✓ Resized to ${TARGET_WIDTH}x${TARGET_HEIGHT} (RGB, no alpha)\n`);

    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log('✅ All screenshots resized successfully!');
  console.log(`Format: ${TARGET_WIDTH}x${TARGET_HEIGHT} PNG (24-bit, no alpha)`);
}

resizeScreenshots().catch(console.error);
