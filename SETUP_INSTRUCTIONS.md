# Kerege Synak - Setup Instructions

## Google Apps Script Backend Setup

### Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "Kerege Synak Database"
3. Copy the Spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part

### Step 2: Deploy Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `google-apps-script.js` and paste it into the editor
4. **Update the configuration** at the top of the script:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual ID
   ```
5. Click **Save** (disk icon)
6. Name your project "Kerege Synak Backend"

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Kerege Synak API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize access**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to Kerege Synak Backend (unsafe)"
   - Click "Allow"
7. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/LONG_ID_HERE/exec
   ```

### Step 4: Update Frontend Configuration

1. Open `app.js` in your project
2. Find the `CONFIG` object at the top:
   ```javascript
   const CONFIG = {
       SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
   };
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with the Web App URL you copied
4. Save the file

### Step 5: Test the Setup

1. Open `index.html` in your browser
2. Navigate to the admin panel by adding `#keregemanager` to the URL:
   ```
   file:///c:/Users/admin/Desktop/kerege/index.html#keregemanager
   ```
3. Login with password: `Kerege2026`
4. Try uploading a test:
   - Enter test name (e.g., "Математика 2024")
   - Select language
   - Set duration (e.g., 45 minutes)
   - Upload a test image
   - Enter answer key (e.g., `A,B,C,D,E,A,B,C,D,E`)
   - Click "Загрузить тест"

### Step 6: Verify Data Storage

1. Go back to your Google Spreadsheet
2. You should see two new sheets created automatically:
   - **Tests**: Contains uploaded test information
   - **Results**: Will contain student submissions
3. Check that your test data appears in the Tests sheet

## Running the Application

### Local Development

1. Open `index.html` directly in your browser:
   ```
   file:///c:/Users/admin/Desktop/kerege/index.html
   ```

### Production Deployment

For production, you'll need to host the files on a web server. Options include:

1. **GitHub Pages** (Free):
   - Create a GitHub repository
   - Push your files
   - Enable GitHub Pages in repository settings

2. **Netlify** (Free):
   - Drag and drop your folder to [Netlify Drop](https://app.netlify.com/drop)

3. **Vercel** (Free):
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel` in your project folder

## Troubleshooting

### Tests Not Loading

1. Check browser console for errors (F12)
2. Verify the `SCRIPT_URL` in `app.js` is correct
3. Make sure the Google Apps Script is deployed with "Anyone" access

### Photo Upload Fails

1. Check that the image file is not too large (max ~50MB)
2. Verify the Google Apps Script has permission to create Drive files
3. Check the browser console for specific error messages

### Results Not Saving

1. Verify the spreadsheet ID is correct in the Google Apps Script
2. Check that the script has permission to edit the spreadsheet
3. Look for errors in the Apps Script execution logs:
   - Go to Apps Script editor
   - Click "Executions" (clock icon on left)

## WhatsApp Integration

The current implementation collects WhatsApp numbers but does not automatically send messages. To send results to students:

### Manual Method
1. Check the "Results" sheet in Google Spreadsheet
2. Manually message students via WhatsApp

### Automated Method (Advanced)
Integrate a WhatsApp Business API service:
- [Twilio WhatsApp API](https://www.twilio.com/whatsapp)
- [WhatsApp Business Platform](https://business.whatsapp.com/)
- Add API calls to the `submitResult` function in Google Apps Script

## Security Notes

- The admin password is stored in plain text in `admin.js`
- For production, consider implementing proper authentication
- The Google Apps Script is publicly accessible but requires knowing the URL
- Student data is stored in Google Sheets - ensure proper access controls

## Support

If you encounter issues:
1. Check the browser console (F12) for JavaScript errors
2. Check Apps Script execution logs for backend errors
3. Verify all configuration values are correct
4. Ensure all Google permissions are granted
