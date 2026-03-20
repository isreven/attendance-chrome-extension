// Popup interaction logic
let dateRowCounter = 0;

console.log('📄 popup.js loaded');

// Initialize popup when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOMContentLoaded fired');
  initializeUI();
  loadActivityCodes();
  loadScheduleSettings();
  attachEventListeners();
  console.log('✅ All initialization complete');
});

// Initialize UI components
function initializeUI() {
  // Check if we're on the correct page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab.url.includes('sapilattendance.il.c.eu-de-1.cloud.sap')) {
      showWarning('נא לנווט לדף הנוכחות של SAP Synerion תחילה');
      disableButtons();
    }
  });
}

// Load activity codes into the reference section
function loadActivityCodes() {
  const container = document.getElementById('codesListContainer');

  ACTIVITY_CODES.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'code-item' + (activity.isDefault ? ' default' : '');
    item.innerHTML = `
      <span class="code-number">${activity.code}</span>
      <span>${activity.hebrew}</span>
      <span style="color: #999; font-size: 11px;"> (${activity.english})</span>
    `;
    container.appendChild(item);
  });
}

// Attach event listeners
function attachEventListeners() {
  // Update All button
  document.getElementById('updateAllBtn').addEventListener('click', () => {
    // Ask if user wants to override existing edits
    const override = confirm('האם לעדכן גם שורות שכבר ערכת ידנית (כמו חופשה)?\n\nYes = עדכן הכל\nNo = דלג על שורות שערכתי');
    console.log('🔍 User selected override:', override);
    updateAttendance('', override);
  });

  // Add Date button
  document.getElementById('addDateBtn').addEventListener('click', () => {
    addDateRow();
  });

  // Clear All button
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    clearAllDateRows();
  });

  // Update Custom button
  document.getElementById('updateCustomBtn').addEventListener('click', () => {
    const customDates = getCustomUpdatesString();
    const override = confirm('האם לעדכן גם שורות שכבר ערכת ידנית?\n\nYes = עדכן הכל\nNo = דלג על שורות שערכתי');
    console.log('🔍 User selected override:', override);
    updateAttendance(customDates, override);
  });

  // Save Schedule button
  document.getElementById('saveScheduleBtn').addEventListener('click', async () => {
    const enabled = document.getElementById('enableSchedule').checked;
    const time = document.getElementById('scheduleTime').value;

    await chrome.storage.sync.set({
      scheduleEnabled: enabled,
      scheduleTime: time
    });

    // Notify background script to update alarm
    chrome.runtime.sendMessage({
      action: 'updateSchedule',
      enabled: enabled,
      time: time
    }, (response) => {
      if (response && response.success) {
        addLogEntry('✅ הגדרות תזמון נשמרו', 'success');
        document.getElementById('statusSection').classList.remove('hidden');
        loadScheduleSettings(); // Refresh next alarm time
      }
    });
  });

  // Update Now button
  document.getElementById('updateNowBtn').addEventListener('click', () => {
    // Ask if user wants to override existing edits
    const override = confirm('האם לעדכן גם שורות שכבר ערכת ידנית (כמו חופשה)?\n\nYes = עדכן הכל\nNo = דלג על שורות שערכתי');
    console.log('🔍 User selected override:', override);

    const statusSection = document.getElementById('statusSection');
    const statusLog = document.getElementById('statusLog');

    statusSection.classList.remove('hidden');
    statusLog.innerHTML = '';
    addLogEntry('🚀 Opening Synerion and starting update...', 'info');

    // Send message to background script to execute auto-update
    chrome.runtime.sendMessage({
      action: 'updateNow',
      customDates: '',
      overrideExisting: override
    }, (response) => {
      if (chrome.runtime.lastError) {
        addLogEntry(`❌ Error: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }

      if (response && response.success) {
        addLogEntry('✅ Update request sent. Check Synerion tab for progress.', 'success');
      } else {
        addLogEntry('❌ Failed to start update', 'error');
      }
    });
  });
}

// Add a new date/code row
function addDateRow(date = '', code = '27') {
  const rowId = `date-row-${dateRowCounter++}`;
  const dateRowsContainer = document.getElementById('dateRows');

  const row = document.createElement('div');
  row.className = 'date-row';
  row.id = rowId;

  // Date input
  const dateInput = document.createElement('input');
  dateInput.type = 'text';
  dateInput.placeholder = 'DDMM or DDMM-DDMM';
  dateInput.value = date;
  dateInput.maxLength = 11; // Max: DD/MM-DD/MM
  dateInput.style.width = '120px';

  // Auto-format date as user types (1803 → 18/03 or 1203-1503 → 12/03-15/03)
  dateInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d-]/g, ''); // Keep only digits and dash

    // Check if it's a range (contains dash)
    if (value.includes('-')) {
      const [start, end] = value.split('-');
      let formatted = '';

      // Format start date (up to 4 digits)
      if (start.length >= 2) {
        formatted = start.slice(0, 2) + '/' + start.slice(2, 4);
      } else {
        formatted = start;
      }

      // Add dash and format end date if present
      if (end !== undefined) {
        formatted += '-';
        if (end.length >= 2) {
          formatted += end.slice(0, 2) + '/' + end.slice(2, 4);
        } else {
          formatted += end;
        }
      }

      e.target.value = formatted;
    } else {
      // Single date format
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      e.target.value = value;
    }

    validateDateRows();
  });

  // Activity code dropdown
  const codeSelect = document.createElement('select');
  ACTIVITY_CODES.forEach(activity => {
    const option = document.createElement('option');
    option.value = activity.code;
    option.textContent = `${activity.code} - ${activity.hebrew}`;
    if (activity.code === code) {
      option.selected = true;
    }
    codeSelect.appendChild(option);
  });
  codeSelect.addEventListener('change', validateDateRows);

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '✕';
  removeBtn.title = 'הסר תאריך';
  removeBtn.addEventListener('click', () => {
    row.remove();
    validateDateRows();
  });

  row.appendChild(dateInput);
  row.appendChild(codeSelect);
  row.appendChild(removeBtn);

  dateRowsContainer.appendChild(row);

  validateDateRows();
}

// Remove all date rows
function clearAllDateRows() {
  const dateRowsContainer = document.getElementById('dateRows');
  dateRowsContainer.innerHTML = '';
  validateDateRows();
}

// Validate date rows and enable/disable update button
function validateDateRows() {
  const dateRows = document.querySelectorAll('.date-row');
  const updateBtn = document.getElementById('updateCustomBtn');

  if (dateRows.length === 0) {
    updateBtn.disabled = true;
    return;
  }

  // Check if all date inputs are valid
  let allValid = true;
  dateRows.forEach(row => {
    const dateInput = row.querySelector('input[type="text"]');
    const dateValue = dateInput.value.trim();

    // Validate DD/MM format OR DD/MM-DD/MM range format
    const singleDatePattern = /^\d{1,2}\/\d{1,2}$/;
    const rangePattern = /^\d{1,2}\/\d{1,2}-\d{1,2}\/\d{1,2}$/;

    if (!singleDatePattern.test(dateValue) && !rangePattern.test(dateValue)) {
      allValid = false;
    }
  });

  updateBtn.disabled = !allValid;
}

// Get custom updates string from UI
function getCustomUpdatesString() {
  const dateRows = document.querySelectorAll('.date-row');
  const updates = [];

  dateRows.forEach(row => {
    const dateInput = row.querySelector('input[type="text"]');
    const codeSelect = row.querySelector('select');

    const dateValue = dateInput.value.trim();
    const code = codeSelect.value;

    if (dateValue && code) {
      // Check if it's a date range
      if (dateValue.includes('-')) {
        // Expand date range (12/03-15/03 → 12/03, 13/03, 14/03, 15/03)
        const [startStr, endStr] = dateValue.split('-');
        const [startDay, startMonth] = startStr.split('/').map(Number);
        const [endDay, endMonth] = endStr.split('/').map(Number);

        // If same month, expand day range
        if (startMonth === endMonth) {
          for (let day = startDay; day <= endDay; day++) {
            // Pad with leading zeros to match SAP format (DD/MM)
            const paddedDay = day.toString().padStart(2, '0');
            const paddedMonth = startMonth.toString().padStart(2, '0');
            updates.push(`${paddedDay}/${paddedMonth}:${code}`);
          }
        } else {
          // Different months - just add both endpoints (or handle cross-month logic)
          const [sd, sm] = startStr.split('/');
          const [ed, em] = endStr.split('/');
          updates.push(`${sd.padStart(2, '0')}/${sm.padStart(2, '0')}:${code}`);
          updates.push(`${ed.padStart(2, '0')}/${em.padStart(2, '0')}:${code}`);
        }
      } else {
        // Single date - pad with leading zeros
        const [day, month] = dateValue.split('/');
        const paddedDay = day.padStart(2, '0');
        const paddedMonth = month.padStart(2, '0');
        updates.push(`${paddedDay}/${paddedMonth}:${code}`);
      }
    }
  });

  return updates.join(',');
}

// Send update request via background script (works from any page)
async function updateAttendance(customDates, overrideExisting = false) {
  console.log('📤 Sending update request with override:', overrideExisting);

  const statusSection = document.getElementById('statusSection');
  const statusLog = document.getElementById('statusLog');
  const progressFill = document.getElementById('progressBarFill');

  // Show status section
  statusSection.classList.remove('hidden');
  statusLog.innerHTML = '';
  progressFill.style.width = '0%';

  addLogEntry('🚀 מתחיל עדכון...', 'info');

  // Disable all buttons during update
  disableButtons();

  try {
    progressFill.style.width = '20%';

    // Send message to background script to handle opening/finding Synerion tab
    chrome.runtime.sendMessage({
      action: 'updateNow',
      customDates: customDates,
      overrideExisting: overrideExisting
    }, (response) => {
      if (chrome.runtime.lastError) {
        addLogEntry(`❌ שגיאה: ${chrome.runtime.lastError.message}`, 'error');
        enableButtons();
        return;
      }

      progressFill.style.width = '100%';

      if (response && response.success) {
        addLogEntry('✅ עדכון נשלח בהצלחה! בדוק את דף Synerion להתקדמות', 'success');
      } else {
        addLogEntry(`❌ שגיאה: ${response ? response.error : 'לא ניתן להתחבר'}`, 'error');
      }

      enableButtons();
    });

  } catch (error) {
    addLogEntry(`❌ שגיאה: ${error.message}`, 'error');
    enableButtons();
  }
}

// Add log entry to status display
function addLogEntry(message, type = 'info') {
  const statusLog = document.getElementById('statusLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  statusLog.appendChild(entry);

  // Scroll to bottom
  statusLog.scrollTop = statusLog.scrollHeight;
}

// Show warning message
function showWarning(message) {
  const statusSection = document.getElementById('statusSection');
  const statusLog = document.getElementById('statusLog');

  statusSection.classList.remove('hidden');
  statusLog.innerHTML = '';
  addLogEntry(`⚠️ ${message}`, 'error');
}

// Disable all buttons
function disableButtons() {
  document.getElementById('updateAllBtn').disabled = true;
  document.getElementById('updateCustomBtn').disabled = true;
  document.getElementById('addDateBtn').disabled = true;
  document.getElementById('clearAllBtn').disabled = true;
}

// Enable all buttons
function enableButtons() {
  document.getElementById('updateAllBtn').disabled = false;
  document.getElementById('addDateBtn').disabled = false;
  document.getElementById('clearAllBtn').disabled = false;
  validateDateRows(); // Re-validate to set updateCustomBtn state
}

// Load schedule settings from storage
async function loadScheduleSettings() {
  const settings = await chrome.storage.sync.get(['scheduleEnabled', 'scheduleTime']);

  document.getElementById('enableSchedule').checked = settings.scheduleEnabled || false;
  document.getElementById('scheduleTime').value = settings.scheduleTime || '9';

  // Load next alarm time
  chrome.runtime.sendMessage({ action: 'getNextAlarmTime' }, (response) => {
    const nextAlarmInfo = document.getElementById('nextAlarmInfo');
    if (response && response.success) {
      nextAlarmInfo.textContent = `תזמון הבא: ${response.nextRun}`;
      nextAlarmInfo.style.color = '#0070f3';
    } else if (settings.scheduleEnabled) {
      nextAlarmInfo.textContent = 'התזמון יופעל בשמירה';
      nextAlarmInfo.style.color = '#999';
    } else {
      nextAlarmInfo.textContent = 'התזמון כבוי';
      nextAlarmInfo.style.color = '#999';
    }
  });
}

