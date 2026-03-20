const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = './screenshots';
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 800;

async function fixScreenshots() {
  const files = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
    .sort();

  console.log(`Found ${files.length} screenshots to fix...\n`);

  for (const file of files) {
    const inputPath = path.join(SCREENSHOTS_DIR, file);
    const outputPath = path.join(SCREENSHOTS_DIR, file);

    console.log(`Processing ${file}...`);

    try {
      const metadata = await sharp(inputPath).metadata();
      console.log(`  Current: ${metadata.width}x${metadata.height}`);

      await sharp(inputPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'contain',  // Maintain aspect ratio, add white bars if needed
          background: { r: 245, g: 245, b: 245 }  // Light gray background
        })
        .flatten({ background: { r: 245, g: 245, b: 245 } })  // Remove alpha
        .png({ compressionLevel: 9 })
        .toFile(outputPath + '.fixed');

      // Replace original
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath + '.fixed', outputPath);
      
      console.log(`  ✓ Fixed to ${TARGET_WIDTH}x${TARGET_HEIGHT} (RGB, no alpha)\n`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ All screenshots fixed!');
  console.log('Format: 1280x800 PNG (24-bit RGB, no alpha channel)');
  console.log('\nThey should now upload to Chrome Web Store without errors.');
}

fixScreenshots().catch(console.error);
