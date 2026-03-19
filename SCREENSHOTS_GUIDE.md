# Screenshot Guide for Chrome Web Store

## 📸 Quick Method - Use Mockup File

I've created a visual mockup with 5 screenshot layouts ready to capture.

### Steps:

1. **Open the mockup:**
   ```bash
   open ~/my-claude-skills/attendance-chrome-extension/screenshots-mockup.html
   ```

2. **Take screenshots:**
   - **Mac:** Press `Cmd+Shift+5` → Select area → Capture
   - **Chrome DevTools:** Press `Cmd+Shift+P` → Type "screenshot" → "Capture screenshot"

3. **Capture each mockup:**
   - Screenshot 1: Main interface (clean state)
   - Screenshot 2: Custom date builder (with 3 dates)
   - Screenshot 3: Activity codes reference (expanded)
   - Screenshot 4: Success state (after update)
   - Screenshot 5: Extension in context (optional - shows page + popup)

4. **Resize if needed:**
   - Required: 1280x800 or 640x400 pixels
   - Current mockups are 400px wide - scale up to 1280px or 640px

5. **Save as:**
   ```
   ~/my-claude-skills/attendance-chrome-extension/screenshots/
   ├── screenshot-1-main.png
   ├── screenshot-2-builder.png
   ├── screenshot-3-codes.png
   ├── screenshot-4-success.png
   └── screenshot-5-context.png
   ```

---

## 🎯 Alternative - Real Extension Screenshots

If you prefer screenshots from the actual running extension:

1. **Load extension in Chrome:**
   - Go to `chrome://extensions/`
   - Load unpacked: `~/my-claude-skills/attendance-chrome-extension`

2. **Navigate to SAP Synerion** (while logged in)

3. **Click extension icon** to open popup

4. **Take screenshots:**
   - Main view
   - Click "הוסף תאריך" 3 times and fill in dates
   - Expand activity codes section
   - (For success state - you'd need to actually run it)

5. **Capture with Chrome DevTools:**
   - Right-click popup → Inspect
   - Press `Cmd+Shift+P`
   - Type "screenshot"
   - Choose "Capture node screenshot" (after selecting popup element)

---

## 📏 Chrome Web Store Requirements

- **Minimum:** 1 screenshot (required)
- **Recommended:** 3-5 screenshots
- **Format:** PNG or JPEG
- **Size:** 1280x800 or 640x400 pixels
- **Max file size:** 5 MB each

---

## ✅ What to Show

1. **Screenshot 1:** Main UI showing big "Update All" button ← Essential
2. **Screenshot 2:** Date builder with 2-3 custom dates added ← Shows key feature
3. **Screenshot 3:** Activity codes list expanded ← Shows all 29 codes
4. **Screenshot 4:** Success message after update ← Shows it works
5. **Screenshot 5:** Extension in context on SAP page ← Optional but nice

**Minimum viable:** Screenshots 1 and 2 are sufficient for approval.
