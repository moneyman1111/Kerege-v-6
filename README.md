# Kerege Synak - Quick Start Guide

## 🚀 Getting Started

### 1. Open the Application
Simply open `index.html` in your browser:
```
file:///c:/Users/admin/Desktop/kerege/index.html
```

### 2. Set Up Backend (Required for Full Functionality)

**Important:** The app needs Google Apps Script to work. Follow these steps:

1. **Create Google Spreadsheet**
   - Go to https://sheets.google.com
   - Create new spreadsheet: "Kerege Synak Database"
   - Copy the ID from URL

2. **Deploy Google Apps Script**
   - In spreadsheet: Extensions → Apps Script
   - Paste code from `google-apps-script.js`
   - Update `SPREADSHEET_ID` at top of script
   - Deploy → New deployment → Web app
   - Set "Who has access" to "Anyone"
   - Copy the deployment URL

3. **Update Frontend**
   - Open `app.js`
   - Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with deployment URL
   - Save file

### 3. Test the Application

**Admin Panel:**
- Navigate to: `index.html#keregemanager` (hidden route)
- Password: `Kerege2026`
- Upload a test with photo and answer key

**Student Flow:**
- Open `index.html`
- Click "Выбрать тест"
- Select a test
- Fill in lead form
- Take the test
- Submit and see results

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `index.html` | Main application structure |
| `styles.css` | All styling and design |
| `app.js` | Frontend logic (update SCRIPT_URL here) |
| `admin.js` | Admin panel functionality |
| `google-apps-script.js` | Backend code (deploy to Google) |
| `SETUP_INSTRUCTIONS.md` | Detailed setup guide |

## 🎨 Branding

- **Logo:** Red "Kerege" text
- **Primary Color:** #E31E24 (red)
- **Background:** #FFFFFF (white)
- **Font:** Inter

## 🔑 Key Features

✅ Landing page with hero and problem cards  
✅ Lead capture with WhatsApp (+996 mask)  
✅ Test interface with timer and zoom  
✅ ORT-style answer bubbles (A, B, C, D, E)  
✅ Auto-scoring (140 + correct/total × 60)  
✅ Admin panel for test uploads  
✅ Google Sheets data storage  

## ⚠️ Important Notes

1. **SCRIPT_URL must be updated** in `app.js` for the app to work
2. **Admin password** is `Kerege2026` (stored in `admin.js`)
3. **WhatsApp messages** are not sent automatically - check Results sheet
4. **Test photos** are stored in Google Drive folder "Kerege Tests"

## 🌐 Deployment Options

**For Production:**
- GitHub Pages (free)
- Netlify (free)
- Vercel (free)

Just upload all files to your chosen platform.

## 📊 Data Storage

**Tests Sheet:**
- Test metadata and answer keys

**Results Sheet:**
- Student submissions with scores
- WhatsApp numbers for follow-up

## 🆘 Troubleshooting

**Tests not loading?**
- Check SCRIPT_URL in app.js
- Verify Google Apps Script is deployed

**Upload failing?**
- Check image file size (max ~50MB)
- Verify script permissions

**Results not saving?**
- Check browser console (F12)
- Verify SPREADSHEET_ID in script

---

For detailed instructions, see [SETUP_INSTRUCTIONS.md](file:///c:/Users/admin/Desktop/kerege/SETUP_INSTRUCTIONS.md)
