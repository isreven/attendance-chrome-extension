// Content script - Runs on SAP Synerion pages
// Ported from update-attendance.js Puppeteer version

// DEFAULT_ACTIVITY_TEXT is defined in utils/activity-codes.js (loaded first in manifest)

// Parse custom updates from format "DD/MM:CODE,DD/MM:CODE"
function parseCustomUpdates(customArg) {
  if (!customArg || customArg.trim() === '') {
    return [];
  }

  const updates = [];
  const pairs = customArg.split(',');

  for (const pair of pairs) {
    const [date, activity] = pair.split(':').map(s => s.trim());
    if (date && activity) {
      updates.push({ date, activity });
    }
  }

  return updates;
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Close left panel if open
async function closeLeftPanel() {
  try {
    const panelBtn = document.querySelector('.btn-right-pane.btn-pressed');
    if (panelBtn) {
      console.log('🔘 Closing left panel...');
      panelBtn.click();
      await sleep(1000);
      console.log('✓ Left panel closed');
      return true;
    }
  } catch (e) {
    console.log('⚠️  Left panel already closed or not found');
  }
  return false;
}

// Update a single row's activity code
async function updateRow(row, targetActivity) {
  console.log(`\n--- Updating row ---`);

  // Click to select row
  row.click();
  await sleep(1500);

  // Verify selected
  if (!row.classList.contains('selected-row')) {
    console.log(`⚠️  Row not selected, skipping`);
    return false;
  }

  // Get cells
  const cells = row.querySelectorAll('td');
  if (cells.length < 3) {
    console.log(`⚠️  Not enough cells`);
    return false;
  }

  const activityCell = cells[2];

  // Find all ui-select toggles
  const uiSelectToggles = activityCell.querySelectorAll('.ui-select-toggle');

  if (uiSelectToggles.length === 0) {
    console.log(`⚠️  No dropdown found (readonly)`);
    return false;
  }

  console.log(`✓ Found ${uiSelectToggles.length} dropdown(s)`);

  // Only update the LAST non-empty dropdown
  for (let j = uiSelectToggles.length - 1; j >= 0; j--) {
    const toggle = uiSelectToggles[j];

    const currentText = toggle.querySelector('.ui-select-match-text')?.textContent.trim() || '';

    // Skip empty dropdowns
    if (!currentText) {
      continue;
    }

    console.log(`  Dropdown ${j + 1}: "${currentText}"`);

    // Check if already correct
    if (currentText.includes(targetActivity)) {
      console.log(`  ✓ Already correct`);
      return true;
    }

    // Open dropdown
    toggle.click();
    await sleep(800);

    // Find and click target option
    const items = Array.from(document.querySelectorAll('.ui-select-choices-row'));
    let found = false;

    for (const item of items) {
      const text = item.textContent.trim();
      const isMatch = text.includes(targetActivity) ||
                      (targetActivity.match(/^\d+$/) && text.startsWith(`(${targetActivity})`));

      if (isMatch) {
        item.click();
        console.log(`  ✓ Updated to: ${text}`);
        await sleep(300);

        // Click save button
        console.log(`💾 Clicking save button (חשב ושמור)...`);
        try {
          const saveBtn = document.querySelector('button.fa-calculator');
          if (saveBtn) {
            saveBtn.click();
            console.log(`✓ Saved`);
            await sleep(2000); // Wait for save to complete
          } else {
            console.log(`⚠️  Save button not found`);
          }
        } catch (e) {
          console.log(`⚠️  Could not click save button: ${e.message}`);
        }

        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`  ⚠️  Could not find option for "${targetActivity}"`);
    }

    // Only update ONE dropdown per row
    return found;
  }

  return false;
}

// Main update attendance function
async function updateAttendance(customUpdates = []) {
  console.log('🚀 Starting attendance update...');

  try {
    // Close left panel first
    await closeLeftPanel();

    // Wait for table
    const table = document.querySelector('table tbody');
    if (!table) {
      throw new Error('לא נמצא טבלת נוכחות. ודא שאתה בדף הנכון');
    }

    await sleep(2000);

    let updatedCount = 0;
    const updatedRowsList = [];
    const processedDates = new Set();

    // Keep processing until no more rows need updating
    while (processedDates.size < 50) { // Safety limit
      // Re-query all rows each time
      const allRows = document.querySelectorAll('table tbody tr');

      if (allRows.length === 0) {
        break;
      }

      let foundUnprocessedRow = false;

      // Scan all rows to find one that needs updating
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];

        // Get row info
        const cells = row.querySelectorAll('td');
        const dateText = cells[1]?.textContent.trim() || '';
        const activityText = cells[2]?.textContent.trim() || '';

        // Extract date
        const dateMatch = dateText.match(/(\d{1,2}\/\d{1,2})/);
        const rowDate = dateMatch ? dateMatch[1] : '';

        if (!rowDate || processedDates.has(rowDate)) {
          continue; // Already processed this date
        }

        // Determine target activity for this date
        let targetActivity = DEFAULT_ACTIVITY_TEXT;
        const customUpdate = customUpdates.find(u => u.date === rowDate);
        if (customUpdate) {
          targetActivity = customUpdate.activity;
        }

        // Check if already correct
        if (activityText.includes(targetActivity)) {
          processedDates.add(rowDate);
          continue;
        }

        // Found a row to update!
        foundUnprocessedRow = true;
        console.log(`\n--- Processing ${rowDate} ---`);
        console.log(`Current: "${activityText.substring(0, 50).replace(/\n/g, ' ')}"`);
        console.log(`Target: "${targetActivity}"`);

        // Update the row
        const success = await updateRow(row, targetActivity);

        if (success) {
          updatedCount++;
          updatedRowsList.push(`${rowDate}: ${targetActivity}`);
        }

        // Mark this date as processed
        processedDates.add(rowDate);
        break; // Exit inner loop to re-query rows
      }

      if (!foundUnprocessedRow) {
        break;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ UPDATE SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Total rows updated: ${updatedCount}`);
    console.log(`📊 Total rows processed: ${processedDates.size}`);

    if (updatedRowsList.length > 0) {
      console.log(`\n✅ Updated rows:`);
      updatedRowsList.forEach(row => console.log(`   - ${row}`));
    }

    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      updatedCount: updatedCount,
      processedCount: processedDates.size,
      updatedRows: updatedRowsList
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'updateAttendance') {
    console.log('📩 Received update request from popup');
    console.log('Custom dates:', request.customDates);

    const customUpdates = parseCustomUpdates(request.customDates);

    if (customUpdates.length > 0) {
      console.log('\n📋 Will update these specific dates:');
      customUpdates.forEach(u => console.log(`  ${u.date} → ${u.activity}`));
    }
    console.log('📋 All other rows will be updated to: עבודה מרחוק (Remote Work)\n');

    // Run async update and send response
    updateAttendance(customUpdates)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    // Return true to indicate async response
    return true;
  }
});

console.log('✅ SAP Synerion Attendance Updater - Content script loaded');
