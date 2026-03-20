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
  await sleep(1800); // Wait for row selection and dropdowns to load

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

  // Find the LAST dropdown that has actual text (not empty)
  let targetDropdownIndex = -1;
  let targetDropdown = null;

  for (let j = uiSelectToggles.length - 1; j >= 0; j--) {
    const toggle = uiSelectToggles[j];
    const currentText = toggle.querySelector('.ui-select-match-text')?.textContent.trim() || '';

    console.log(`  Dropdown ${j + 1}: "${currentText || '(empty)'}"`);

    // Found the last non-empty dropdown
    if (currentText) {
      targetDropdownIndex = j;
      targetDropdown = toggle;

      // Check if already correct
      if (currentText.includes(targetActivity)) {
        console.log(`  ✓ Already correct`);
        return true;
      }

      break; // Found our target, stop looking
    }
  }

  // If no filled dropdown found, use the last one
  if (!targetDropdown) {
    console.log(`  No filled dropdowns found, using last dropdown`);
    targetDropdownIndex = uiSelectToggles.length - 1;
    targetDropdown = uiSelectToggles[targetDropdownIndex];
  }

  console.log(`  🎯 Will update dropdown ${targetDropdownIndex + 1}`);

  // Get current value
  const currentValue = targetDropdown.querySelector('.ui-select-match-text')?.textContent.trim() || '';
  console.log(`  Current value: "${currentValue}"`);

  // Check if this dropdown has a clear button (X) and is NOT already the default
  const clearButton = targetDropdown.querySelector('a.btn-link[ng-click*="clear"] i.glyphicon-remove');
  const isDefault = currentValue.includes('העדרות ללא רשות');

  if (clearButton && !isDefault) {
    // Has a value that's NOT the default - need to clear it first
    console.log(`  🗑️  Clearing dropdown ${targetDropdownIndex + 1} (has non-default value)...`);
    const clearBtn = clearButton.parentElement;
    clearBtn.click();
    await sleep(800);
    console.log(`  ✓ Cleared`);

    // Click another row briefly (come back before it changes - within 1-3 sec)
    console.log(`  🔄 Clicking different row briefly...`);
    const allRows = document.querySelectorAll('table tbody tr');
    const currentIndex = Array.from(allRows).indexOf(row);

    // Click the next row if available, otherwise previous row
    const otherRow = allRows[currentIndex + 1] || allRows[currentIndex - 1];
    if (otherRow) {
      otherRow.click();
      await sleep(400); // Wait LESS than 1 second - come back before it changes!
    }

    // Click back to the original row
    console.log(`  🔙 Re-selecting original row...`);
    row.click();
    await sleep(3000); // Wait even longer for the row to fully load with default value

    // Verify row is selected
    if (!row.classList.contains('selected-row')) {
      console.log(`  ⚠️  Row not selected after coming back, trying again...`);
      row.click();
      await sleep(2000);
    }

    // Re-query the CELLS after coming back (important!)
    const refreshedCells = row.querySelectorAll('td');
    if (refreshedCells.length < 3) {
      console.log(`  ❌ Could not find cells after refresh`);
      return false;
    }

    const refreshedActivityCell = refreshedCells[2];

    // Re-query ALL dropdowns after coming back
    const allRefreshedToggles = refreshedActivityCell.querySelectorAll('.ui-select-toggle');
    console.log(`  ℹ️  Found ${allRefreshedToggles.length} dropdowns after refresh`);

    // If no dropdowns found, wait more and try again
    if (allRefreshedToggles.length === 0) {
      console.log(`  ⏳ No dropdowns found, waiting longer...`);
      await sleep(2000);
      const retryToggles = refreshedActivityCell.querySelectorAll('.ui-select-toggle');
      console.log(`  ℹ️  Retry found ${retryToggles.length} dropdowns`);

      if (retryToggles.length === 0) {
        console.log(`  ❌ Still no dropdowns after retry`);
        return false;
      }

      // Use retry result - find last non-empty dropdown
      let foundDropdown = false;
      for (let k = retryToggles.length - 1; k >= 0; k--) {
        const text = retryToggles[k].querySelector('.ui-select-match-text')?.textContent.trim() || '';
        console.log(`  Dropdown ${k + 1} after retry: "${text || '(empty)'}"`);
        if (text) {
          targetDropdown = retryToggles[k];
          targetDropdownIndex = k;
          console.log(`  🎯 Will update dropdown ${k + 1} from "${text}" to code 27`);
          foundDropdown = true;
          break;
        }
      }

      // If no filled dropdown, use the last one
      if (!foundDropdown && retryToggles.length > 0) {
        targetDropdownIndex = retryToggles.length - 1;
        targetDropdown = retryToggles[targetDropdownIndex];
        console.log(`  🎯 No filled dropdown after retry, using last one (${targetDropdownIndex + 1})`);
      }
    } else {
      // Find the LAST non-empty dropdown
      let foundDropdown = false;
      for (let k = allRefreshedToggles.length - 1; k >= 0; k--) {
        const text = allRefreshedToggles[k].querySelector('.ui-select-match-text')?.textContent.trim() || '';
        console.log(`  Dropdown ${k + 1} after refresh: "${text || '(empty)'}"`);
        if (text) {
          targetDropdown = allRefreshedToggles[k];
          targetDropdownIndex = k;
          console.log(`  🎯 Will update dropdown ${k + 1} from "${text}" to code 27`);
          foundDropdown = true;
          break;
        }
      }

      // If no filled dropdown, use the last one
      if (!foundDropdown && allRefreshedToggles.length > 0) {
        targetDropdownIndex = allRefreshedToggles.length - 1;
        targetDropdown = allRefreshedToggles[targetDropdownIndex];
        console.log(`  🎯 No filled dropdown after refresh, using last one (${targetDropdownIndex + 1})`);
      }
    }
  } else if (isDefault) {
    // Already has default value - just change it directly
    console.log(`  ✓ Already has default value, will change directly to code 27`);
  } else {
    // No clear button - dropdown is empty or read-only
    console.log(`  ℹ️  No clear button, dropdown is empty`);
  }

  // Small wait for the UI to stabilize
  await sleep(500);

  console.log(`  ⏭️  Now proceeding to set code 27...`);
  console.log(`  Current targetDropdown:`, targetDropdown ? 'exists' : 'NULL');
  console.log(`  Current targetDropdownIndex: ${targetDropdownIndex}`);

  // Now open the dropdown to set new value
  console.log(`  📝 Opening dropdown ${targetDropdownIndex + 1} to set new value...`);
  targetDropdown.click();
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
          await sleep(3000); // Wait for save to complete
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

  return found;
}

// Main update attendance function
async function updateAttendance(customUpdates = [], overrideExisting = false) {
  console.log('🚀 Starting attendance update...');
  console.log('Override existing edits:', overrideExisting);

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

        // If not overriding and row has non-default activity, skip it
        if (!overrideExisting && activityText.trim() !== '' && !activityText.includes(DEFAULT_ACTIVITY_TEXT)) {
          console.log(`⏭️  Skipping ${rowDate} - already edited (${activityText.substring(0, 30)})`);
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
    console.log('Override existing:', request.overrideExisting);

    const customUpdates = parseCustomUpdates(request.customDates);

    if (customUpdates.length > 0) {
      console.log('\n📋 Will update these specific dates:');
      customUpdates.forEach(u => console.log(`  ${u.date} → ${u.activity}`));
    }
    console.log('📋 All other rows will be updated to: עבודה מרחוק (Remote Work)\n');

    // Run async update and send response
    updateAttendance(customUpdates, request.overrideExisting)
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
