# SAP Synerion Attendance Updater - Chrome Extension

Automate updating attendance codes in SAP Synerion with a single click.

## ✨ Features

- 🏠 **One-Click Update** - Update all dates to Remote Work instantly
- 🎯 **Custom Dates** - Build a visual list of specific dates with different activity codes
- 💾 **Auto-Save** - Automatically clicks save after each update
- 🔐 **Session Reuse** - Uses your existing browser login, no credentials needed
- ⚡ **Fast** - No browser launch, runs directly in your active tab
- 📋 **29 Activity Codes** - Full support for all SAP Synerion codes

## 📦 Installation

### Option 1: Load Unpacked (Development)

1. Clone this repository or download the extension folder:
   ```bash
   git clone <repo-url>
   cd my-claude-skills/attendance-chrome-extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **"Load unpacked"**

5. Select the `attendance-chrome-extension` folder

6. Pin the extension to your toolbar for easy access

### Option 2: Chrome Web Store (Production)

*Coming soon - will be published to Chrome Web Store*

## 🚀 Usage

### Quick Update (All to Remote Work)

1. Navigate to [SAP Synerion Daily Browser](https://sapilattendance.il.c.eu-de-1.cloud.sap/SynerionWeb/#/dailyBrowser)
2. Make sure you're logged in
3. Click the extension icon in your toolbar
4. Click **"עדכן הכל לעבודה מרחוק"** button
5. Wait for completion message

### Custom Dates Update

1. Navigate to SAP Synerion Daily Browser (while logged in)
2. Click the extension icon
3. Click **"הוסף תאריך"** (Add Date) button
4. Enter date in **DD/MM** format (e.g., `19/03`)
5. Select activity code from dropdown
6. Repeat for more dates if needed
7. Click **"עדכן נוכחות"** (Update Attendance)
8. All other dates will be updated to Remote Work (27)

### Activity Codes Reference

Click the **"📋 רשימת קודי פעילות"** section to see all available codes:

- **27** - עבודה מרחוק (Remote Work) - **DEFAULT**
- **36** - אצל לקוח (Client site)
- **2** - חופשה (Vacation)
- **11** - מחלה (Sick leave)
- And 25 more codes...

## 🔧 How It Works

The extension:

1. **Injects a content script** into SAP Synerion pages
2. **Listens for messages** from the popup UI
3. **Closes the left panel** if open (for better visibility)
4. **Scans all rows** in the attendance table
5. **Updates activity codes** by:
   - Clicking on the row to select it
   - Finding the last non-empty dropdown in the activity column
   - Opening the dropdown and selecting the target code
   - Clicking the save button (חשב ושמור)
6. **Processes one row at a time** to avoid conflicts
7. **Reports results** back to the popup

## 🎯 Key Features

### Smart Dropdown Handling

The extension handles the complex SAP Synerion UI structure:
- Multiple InOut entries per row (multiple dropdowns)
- Only updates the **last non-empty dropdown** (the active one)
- Skips empty/readonly dropdowns
- Re-queries DOM after each update to handle dynamic content

### Intelligent Date Processing

- Extracts dates using regex: `(\d{1,2}\/\d{1,2})`
- Tracks processed dates to avoid duplicates
- Matches both Hebrew text and numeric codes
- Skips rows that already have the correct code

### Automatic Saving

After each activity code change, the extension:
- Clicks the save button (`button.fa-calculator`)
- Waits 2 seconds for save to complete
- Continues to next row

## 🛠️ Development

### Project Structure

```
attendance-chrome-extension/
├── manifest.json              # Extension configuration
├── icons/                     # Extension icons (16, 48, 128px)
├── popup/
│   ├── popup.html            # Popup UI
│   ├── popup.js              # UI interaction logic
│   └── popup.css             # Styling
├── content/
│   └── content.js            # DOM manipulation (ported from Puppeteer)
├── utils/
│   └── activity-codes.js     # Activity code definitions
└── README.md                 # This file
```

### Testing

1. Load the extension in developer mode
2. Open browser console (F12) and switch to extension context
3. Navigate to SAP Synerion while logged in
4. Click extension icon
5. Test both "Update All" and "Custom Dates" scenarios
6. Check console logs for detailed execution trace

### Known Limitations

- Requires active login session on SAP Synerion
- Must be on the daily browser page for updates to work
- Processing is sequential (one row at a time) to avoid conflicts
- Maximum 50 rows per update (safety limit)

## 📤 Sharing with Team

### Method 1: Git Repository (Recommended)

```bash
cd ~/my-claude-skills/attendance-chrome-extension
git init
git add .
git commit -m "Initial Chrome extension for attendance automation"
git remote add origin <your-repo-url>
git push -u origin main
```

Team members:
```bash
git clone <repo-url>
# Then load unpacked in chrome://extensions
```

### Method 2: Zip File

```bash
cd ~/my-claude-skills
zip -r attendance-extension.zip attendance-chrome-extension/ -x "*.git*" "node_modules/*"
```

Share the zip file with your team.

## 🔐 Security Notes

- ✅ No credentials stored - uses your existing browser session
- ✅ Only runs on SAP Synerion domain
- ✅ No external API calls
- ✅ All processing happens locally in your browser
- ⚠️  Keep the extension updated with your team

## 🆘 Troubleshooting

**Extension icon not showing:**
- Make sure Developer mode is enabled
- Check that you selected the correct folder
- Refresh the extensions page

**"Please navigate to SAP Synerion" error:**
- You must be on the daily browser page
- URL must contain `sapilattendance.il.c.eu-de-1.cloud.sap`

**No rows updated:**
- Check browser console (F12) for detailed logs
- Ensure you're logged in
- Verify table is visible on the page
- Try closing the left panel manually first

**Save button not clicking:**
- Check console logs for errors
- The button selector is `button.fa-calculator`
- Try updating manually once to verify page structure

## 📝 License

Internal tool for SAP employees. Not for public distribution.

## 🤝 Contributing

To add features or fix bugs:

1. Create a new branch
2. Make your changes
3. Test thoroughly on SAP Synerion
4. Submit a pull request

## 📞 Support

For issues or questions, contact the maintainer or create an issue in the repository.
