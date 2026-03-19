# Chrome Web Store Publication Guide

Complete step-by-step guide to publish the SAP Synerion Attendance Updater extension.

## 📋 Pre-Publication Checklist

### 1. Test Thoroughly
- [ ] Extension loads without errors
- [ ] "Update All" button works correctly
- [ ] Custom date builder adds/removes rows
- [ ] Activity code updates work on SAP Synerion
- [ ] Save button clicks automatically
- [ ] Status logs display correctly
- [ ] Works on different screen sizes
- [ ] No console errors

### 2. Code Quality
- [ ] Remove debug console.log() statements (or make conditional)
- [ ] Add error boundaries
- [ ] Optimize icon file sizes
- [ ] Remove unused files
- [ ] Clean up comments

### 3. Required Materials
- [x] Privacy policy (✓ Created: PRIVACY.md)
- [x] Store listing description (✓ Created: STORE_LISTING.md)
- [ ] Screenshots (3-5 images, 1280x800)
- [x] Extension icons (✓ 16px, 48px, 128px)
- [ ] Promotional images (optional but recommended)
- [ ] Support email/website

---

## 🚀 Publication Steps

### Step 1: Create Developer Account

1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Pay the **$5 one-time registration fee**
4. Accept the Developer Agreement

### Step 2: Package Your Extension

```bash
cd ~/my-claude-skills
zip -r attendance-extension.zip attendance-chrome-extension/ \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.DS_Store" \
  -x "*generate-icons.js"
```

### Step 3: Upload to Chrome Web Store

1. Go to Developer Dashboard
2. Click "New Item"
3. Upload attendance-extension.zip
4. Fill in all required fields (see STORE_LISTING.md)
5. Host privacy policy online (GitHub Pages, Google Sites, etc.)
6. Add screenshots
7. Submit for review

### Step 4: Review Process (1-3 business days)

Google will review for:
- Malware/security issues
- Permissions justification
- Privacy policy accuracy
- Policy compliance

---

## 📸 Screenshots Guide

Take screenshots of:
1. Main popup with "Update All" button
2. Custom date builder with 2-3 dates added
3. Activity codes reference expanded
4. Success message after update

Use: Cmd+Shift+5 on Mac, or Chrome DevTools screenshot feature

---

## 🌐 Privacy Policy Hosting

**Quick Option - GitHub Pages:**
```bash
cd ~/my-claude-skills/attendance-chrome-extension
mkdir docs
cp PRIVACY.md docs/index.md
git add docs/
git commit -m "Add privacy policy"
git push
# Enable GitHub Pages in repo settings
```

**URL Format:** `https://yourusername.github.io/reponame/`

---

## ⚠️ Important Notes

**For Internal SAP Tool:**
- Consider "Unlisted" visibility (only accessible via direct link)
- Check with IT/legal about publishing company tools
- May need approval for SAP branding

**Distribution Options:**
- **Unlisted:** ✅ SELECTED - Only people with link can install (perfect for internal tools)
  - Won't appear in Chrome Web Store search
  - Share direct link with your team
  - No legal/branding approval needed
  - Can update anytime
- **Public:** Anyone can find and install
- **Private:** Only specific Google Workspace users (requires Workspace)
