// Background Service Worker - Handles scheduling and notifications
// Runs independently of popup or content scripts

console.log('🔧 Background service worker started');

// Helper: Calculate timestamp for next 19th of month
function getNext19thTimestamp(hour = 9) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  // Try this month's 19th at specified hour
  let targetDate = new Date(year, month, 19, hour, 0, 0, 0);

  // If already passed, go to next month
  if (targetDate <= now) {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
    targetDate = new Date(year, month, 19, hour, 0, 0, 0);
  }

  console.log(`⏰ Next alarm scheduled for: ${targetDate.toLocaleString('he-IL')}`);
  return targetDate.getTime();
}

// Create or update the monthly alarm
async function createOrUpdateAlarm() {
  const settings = await chrome.storage.sync.get(['scheduleEnabled', 'scheduleTime']);

  if (!settings.scheduleEnabled) {
    // Disable alarm
    await chrome.alarms.clear('monthlyAttendance');
    console.log('⏰ Monthly alarm disabled');
    return;
  }

  const hour = parseInt(settings.scheduleTime) || 9;

  // Create alarm for next 19th at specified hour
  await chrome.alarms.create('monthlyAttendance', {
    when: getNext19thTimestamp(hour)
  });

  console.log(`✓ Monthly alarm created for 19th at ${hour}:00`);
}

// On extension install/update, set up alarm
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('📦 Extension installed/updated:', details.reason);

  // Initialize default settings if first install
  if (details.reason === 'install') {
    await chrome.storage.sync.set({
      scheduleEnabled: true,
      scheduleTime: 9
    });
    console.log('✓ Default schedule settings initialized');
  }

  // Create the alarm
  await createOrUpdateAlarm();
});

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('⏰ Alarm triggered:', alarm.name);

  if (alarm.name === 'monthlyAttendance') {
    // Show notification asking user what to do
    await showAttendanceReminder();

    // Reschedule for next month
    await createOrUpdateAlarm();
  }
});

// Show notification with action buttons
async function showAttendanceReminder() {
  console.log('🔔 Showing attendance reminder notification');

  try {
    const notificationId = await chrome.notifications.create('attendance-reminder', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Time to Fill Work Hours! 📅',
      message: 'Update your SAP Synerion attendance',
      buttons: [
        { title: 'Open and Update' },
        { title: 'Remind me in 15 minutes' }
      ],
      requireInteraction: true,
      priority: 2,
      silent: false
    });
    console.log('✅ Notification created:', notificationId);
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log(`🔔 Notification button clicked: ${notificationId}, button ${buttonIndex}`);

  if (notificationId === 'attendance-reminder') {
    // Clear the reminder notification
    await chrome.notifications.clear(notificationId);

    if (buttonIndex === 0) {
      // User chose "Open and Update" - show override confirmation first
      console.log('✓ User chose to open and update');

      // Show confirmation for overriding existing values
      await chrome.notifications.create('confirm-override', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: 'Override Existing Edits? 🤔',
        message: 'Do you want to override rows you already manually edited?',
        buttons: [
          { title: 'Yes, override all' },
          { title: 'No, skip edited rows' }
        ],
        requireInteraction: true,
        priority: 2
      });
    } else {
      // User chose "Remind me in 15 minutes" - snooze alarm
      console.log('⏰ User snoozed for 15 minutes');
      await snoozeAlarm(15);
    }
  }

  if (notificationId === 'confirm-override') {
    // Clear the confirmation notification
    await chrome.notifications.clear(notificationId);

    if (buttonIndex === 0) {
      // Yes, override all - pass override flag
      console.log('✓ User chose to override all');
      await executeAutoUpdate('', true);
    } else {
      // No, skip edited rows - don't pass override flag
      console.log('✓ User chose to skip edited rows');
      await executeAutoUpdate('', false);
    }
  }
});

// Execute automatic update
async function executeAutoUpdate(customDates, overrideExisting = false) {
  console.log('🚀 Executing automatic update...');
  console.log('Override existing:', overrideExisting);

  try {
    // Check if SAP Synerion page is already open
    const tabs = await chrome.tabs.query({
      url: 'https://sapilattendance.il.c.eu-de-1.cloud.sap/*'
    });

    if (tabs.length > 0 && tabs[0].status === 'complete') {
      // Page already open - try to use it
      console.log('✓ Found open SAP Synerion tab:', tabs[0].id);

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateAttendance',
        customDates: customDates,
        overrideExisting: overrideExisting
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Content script not loaded, reloading tab...');
          // Content script not injected - reload the tab
          chrome.tabs.reload(tabs[0].id, {}, () => {
            console.log('🔄 Tab reloaded, waiting for content script...');
            // Wait for reload and retry
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
              if (tabId === tabs[0].id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                setTimeout(() => {
                  console.log('📤 Retrying update after reload...');
                  chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateAttendance',
                    customDates: customDates,
                    overrideExisting: overrideExisting
                  }, (retryResponse) => {
                    if (retryResponse && retryResponse.success) {
                      console.log(`✅ Update successful: ${retryResponse.updatedCount} rows`);
                      showSuccessNotification(retryResponse.updatedCount);
                    } else {
                      console.error('❌ Update failed after reload');
                      showErrorNotification('Unable to update. Make sure you are logged in.');
                    }
                  });
                }, 3000);
              }
            });
          });
          return;
        }

        if (response && response.success) {
          console.log(`✅ Update successful: ${response.updatedCount} rows`);
          showSuccessNotification(response.updatedCount);
        } else {
          console.error('❌ Update failed:', response ? response.error : 'Unknown error');
          showErrorNotification(response ? response.error : 'Unknown error');
        }
      });
    } else {
      // Need to open page first
      console.log('📂 Opening SAP Synerion page...');

      chrome.tabs.create({
        url: 'https://sapilattendance.il.c.eu-de-1.cloud.sap/SynerionWeb/#/dailyBrowser',
        active: true
      }, (tab) => {
        console.log('✓ Page opened, waiting for load...');

        // Wait for page to fully load
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log('✓ Page loaded, waiting for content to settle...');

            // Wait a bit more for dynamic Angular content
            setTimeout(() => {
              console.log('📤 Sending update message to content script...');

              chrome.tabs.sendMessage(tab.id, {
                action: 'updateAttendance',
                customDates: customDates,
                overrideExisting: overrideExisting
              }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('❌ Error:', chrome.runtime.lastError);
                  showErrorNotification('Unable to update. Make sure you are logged in to SAP Synerion.');
                  return;
                }

                if (response && response.success) {
                  console.log(`✅ Update successful: ${response.updatedCount} rows`);
                  showSuccessNotification(response.updatedCount);
                } else {
                  console.error('❌ Update failed:', response ? response.error : 'Unknown');
                  showErrorNotification(response ? response.error : 'Update failed');
                }
              });
            }, 3000);
          }
        });
      });
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    showErrorNotification(error.message);
  }
}

// Snooze alarm for specified minutes
async function snoozeAlarm(minutes) {
  console.log(`⏰ Setting snooze alarm for ${minutes} minutes`);

  await chrome.alarms.create('snooze-alarm', {
    when: Date.now() + (minutes * 60 * 1000) // Convert minutes to milliseconds
  });

  // Show confirmation notification
  await chrome.notifications.create('snooze-confirmation', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: 'Reminder Snoozed ⏰',
    message: `I'll remind you again in ${minutes} minutes`,
    priority: 1
  });
}

// Show success notification
async function showSuccessNotification(updatedCount) {
  console.log(`📢 Showing success notification for ${updatedCount} rows...`);

  try {
    const notificationId = await chrome.notifications.create('update-success', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Attendance Updated! ✅',
      message: `Updated ${updatedCount} rows to Remote Work`,
      priority: 2,
      requireInteraction: false // Changed to auto-dismiss
    });
    console.log('✅ Success notification created:', notificationId);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
      console.log('✅ Success notification auto-dismissed');
    }, 4000);
  } catch (error) {
    console.error('❌ Success notification error:', error);
  }
}

// Show error notification
async function showErrorNotification(errorMsg) {
  console.log(`📢 Showing error notification: ${errorMsg}`);

  try {
    const notificationId = await chrome.notifications.create('update-error', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Update Error ❌',
      message: errorMsg,
      priority: 2,
      requireInteraction: true
    });
    console.log('✅ Error notification created:', notificationId);
  } catch (error) {
    console.error('❌ Error notification error:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('📩 Message received:', request.action);

  if (request.action === 'updateSchedule') {
    // Popup is updating schedule settings
    createOrUpdateAlarm()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }

  if (request.action === 'testAlarm') {
    // Test alarm (trigger in 5 seconds for testing)
    chrome.alarms.create('test-alarm', {
      when: Date.now() + 5000 // 5 seconds
    });
    console.log('⏰ Test alarm set for 5 seconds from now');
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getNextAlarmTime') {
    // Get next scheduled alarm time
    chrome.alarms.get('monthlyAttendance', (alarm) => {
      if (alarm) {
        const date = new Date(alarm.scheduledTime);
        sendResponse({
          success: true,
          nextRun: date.toLocaleString('he-IL'),
          timestamp: alarm.scheduledTime
        });
      } else {
        sendResponse({ success: false, message: 'No alarm scheduled' });
      }
    });
    return true;
  }

  if (request.action === 'updateNow') {
    // Manual update triggered from popup
    console.log('🚀 Manual update now requested');
    executeAutoUpdate(request.customDates || '', request.overrideExisting || false)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Update now failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }
});

// Handle test alarm and snooze alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'test-alarm') {
    console.log('🧪 Test alarm triggered!');
    await showAttendanceReminder();
  }

  if (alarm.name === 'snooze-alarm') {
    console.log('⏰ Snooze alarm triggered!');
    await showAttendanceReminder();
  }
});

console.log('✅ Background service worker ready');
