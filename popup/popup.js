// Popup interaction logic
let dateRowCounter = 0;

// Initialize popup when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadActivityCodes();
  attachEventListeners();
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
    updateAttendance('');
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
    updateAttendance(customDates);
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
  dateInput.placeholder = 'DD/MM';
  dateInput.value = date;
  dateInput.maxLength = 5;
  dateInput.addEventListener('input', validateDateRows);

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

    // Validate DD/MM format
    if (!dateValue.match(/^\d{1,2}\/\d{1,2}$/)) {
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

    const date = dateInput.value.trim();
    const code = codeSelect.value;

    if (date && code) {
      updates.push(`${date}:${code}`);
    }
  });

  return updates.join(',');
}

// Send update request to content script
async function updateAttendance(customDates) {
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
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if on correct page
    if (!tab.url.includes('sapilattendance.il.c.eu-de-1.cloud.sap')) {
      throw new Error('נא לנווט לדף הנוכחות של SAP Synerion');
    }

    progressFill.style.width = '20%';

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateAttendance',
      customDates: customDates
    }, (response) => {
      if (chrome.runtime.lastError) {
        addLogEntry(`❌ שגיאה: ${chrome.runtime.lastError.message}`, 'error');
        enableButtons();
        return;
      }

      progressFill.style.width = '100%';

      if (response && response.success) {
        addLogEntry(`✅ הצלחה! עודכנו ${response.updatedCount} שורות`, 'success');

        if (response.updatedRows && response.updatedRows.length > 0) {
          response.updatedRows.forEach(rowInfo => {
            addLogEntry(`  ✓ ${rowInfo}`, 'success');
          });
        }
      } else {
        addLogEntry(`❌ שגיאה: ${response ? response.error : 'לא ניתן להתחבר לדף'}`, 'error');
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
