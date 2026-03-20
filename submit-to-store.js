#!/usr/bin/env node

/**
 * Chrome Web Store Submission Automation
 * Uses Playwright to automate the extension submission process
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_WEB_STORE_URL = 'https://chrome.google.com/webstore/devconsole';
const EXTENSION_ZIP = path.join(__dirname, '..', 'attendance-extension.zip');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Store listing content
const LISTING = {
  name: 'SAP Synerion Attendance Updater',
  summary: 'Automate updating attendance codes in SAP Synerion. One-click remote work updates or custom date/code assignments.',
  description: fs.readFileSync(path.join(__dirname, 'STORE_LISTING.md'), 'utf8')
    .split('### Detailed Description')[1]
    .split('###')[0]
    .trim(),
  category: 'Productivity',
  language: 'Hebrew',
  privacyPolicyUrl: 'https://github.wdf.sap.corp/pages/Portal-CF/attendance-chrome-extension/privacy.html',
  supportUrl: 'https://github.wdf.sap.corp/Portal-CF/attendance-chrome-extension',
  singlePurpose: 'Automate attendance code updates in SAP Synerion',
  permissions: {
    storage: 'Save user preferences for custom date configurations locally in browser',
    activeTab: 'Access SAP Synerion page to automate attendance updates when user clicks extension icon',
    hostPermissions: 'Required to run content script only on sapilattendance.il.c.eu-de-1.cloud.sap domain for attendance automation'
  }
};

async function submitToChromeWebStore() {
  console.log('🚀 Starting Chrome Web Store submission automation...\n');

  // Check if extension zip exists
  if (!fs.existsSync(EXTENSION_ZIP)) {
    console.error('❌ Extension zip not found:', EXTENSION_ZIP);
    process.exit(1);
  }

  console.log('✓ Extension package found:', EXTENSION_ZIP);

  // Check screenshots
  const screenshots = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(SCREENSHOTS_DIR, f));

  if (screenshots.length === 0) {
    console.error('❌ No screenshots found in:', SCREENSHOTS_DIR);
    process.exit(1);
  }

  console.log(`✓ Found ${screenshots.length} screenshots`);

  // Launch browser in non-headless mode so user can see and interact
  console.log('\n🌐 Launching browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {
    // Navigate to Chrome Web Store Developer Console
    console.log('📂 Navigating to Chrome Web Store Developer Console...');
    await page.goto(CHROME_WEB_STORE_URL);

    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('1. Please log in to your Google account if prompted');
    console.log('2. If this is your first time, pay the $5 registration fee');
    console.log('3. Once you see the Developer Dashboard, press ENTER in this terminal to continue...\n');

    // Wait for user to press Enter
    await waitForEnter();

    console.log('\n✓ Continuing with automation...');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for "New Item" button
    console.log('🔍 Looking for "New Item" button...');
    const newItemButton = await page.locator('text=/New Item|Create|Add/i').first();

    if (await newItemButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Found "New Item" button, clicking...');
      await newItemButton.click();
    } else {
      console.log('⚠️  Could not find "New Item" button automatically.');
      console.log('Please click the "New Item" button manually, then press ENTER...');
      await waitForEnter();
    }

    // Wait for upload dialog
    await page.waitForTimeout(2000);

    console.log('\n📤 Uploading extension package...');
    console.log('⚠️  MANUAL STEP: Please use the file picker to upload:');
    console.log(`   ${EXTENSION_ZIP}`);
    console.log('\nAfter upload completes and you see the form, press ENTER...');
    await waitForEnter();

    console.log('\n📝 Filling out store listing form...');

    // Try to fill in the form fields
    await fillFormIfPossible(page, LISTING, screenshots);

    console.log('\n✅ Automation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review all filled fields');
    console.log('2. Upload screenshots if not already done');
    console.log('3. Set visibility to "Unlisted"');
    console.log('4. Click "Submit for Review"');
    console.log('\n⏸️  Keeping browser open for you to review and submit...');
    console.log('Press Ctrl+C when done to close the browser.');

    // Keep browser open
    await new Promise(() => {}); // Wait forever until user closes

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Browser will stay open for manual completion.');
    await new Promise(() => {});
  }
}

// Helper to wait for user to press Enter
function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
}

// Try to fill form fields automatically
async function fillFormIfPossible(page, listing, screenshots) {
  console.log('Attempting to auto-fill form fields...\n');

  // Extension name
  try {
    const nameField = await page.locator('input[name*="name"], input[aria-label*="name"]').first();
    if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameField.fill(listing.name);
      console.log('✓ Filled extension name');
    }
  } catch (e) {
    console.log('⚠️  Could not auto-fill name field');
  }

  // Summary
  try {
    const summaryField = await page.locator('input[name*="summary"], textarea[name*="summary"]').first();
    if (await summaryField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await summaryField.fill(listing.summary);
      console.log('✓ Filled summary');
    }
  } catch (e) {
    console.log('⚠️  Could not auto-fill summary field');
  }

  // Description
  try {
    const descField = await page.locator('textarea[name*="description"]').first();
    if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descField.fill(listing.description);
      console.log('✓ Filled description');
    }
  } catch (e) {
    console.log('⚠️  Could not auto-fill description field');
  }

  // Privacy policy URL
  try {
    const privacyField = await page.locator('input[name*="privacy"], input[aria-label*="privacy"]').first();
    if (await privacyField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await privacyField.fill(listing.privacyPolicyUrl);
      console.log('✓ Filled privacy policy URL');
    }
  } catch (e) {
    console.log('⚠️  Could not auto-fill privacy policy field');
  }

  console.log('\n⚠️  Some fields may need manual completion.');
  console.log('The browser will stay open for you to complete and submit.\n');
}

// Main execution
console.log('═'.repeat(60));
console.log('  Chrome Web Store Submission Automation');
console.log('  SAP Synerion Attendance Updater');
console.log('═'.repeat(60));
console.log('\nThis script will:');
console.log('1. Open Chrome Web Store Developer Console');
console.log('2. Guide you through login/payment if needed');
console.log('3. Help upload the extension');
console.log('4. Auto-fill as many fields as possible');
console.log('5. Leave browser open for you to review and submit');
console.log('\nPress Ctrl+C at any time to stop.\n');

submitToChromeWebStore().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
