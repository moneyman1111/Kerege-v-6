# Google Apps Script Deployment Troubleshooting

## Current Errors

You're seeing these errors:
1. **404 Not Found** - The script URL is not accessible
2. **CORS Policy Error** - No 'Access-Control-Allow-Origin' header

## Root Cause

Your Google Apps Script is either:
- Not deployed correctly
- Not set with proper permissions
- Using an old/invalid deployment URL

## How to Fix (Step-by-Step)

### Step 1: Verify Your Google Apps Script Deployment

1. Open your Google Apps Script project
2. Go to **Deploy → Manage deployments**
3. Check if there's an active Web App deployment
4. If not, create a new deployment:
   - Click **Deploy → New deployment**
   - Select type: **Web app**
   - Execute as: **Me** (your email)
   - Who has access: **Anyone** ⚠️ THIS IS CRITICAL
   - Click **Deploy**

### Step 2: Get the Correct URL

After deployment, you'll get a URL like:
```
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

**Important:** Make sure you're using the `/exec` URL, not the `/dev` URL.

### Step 3: Update app.js

Replace the `SCRIPT_URL` in `app.js` with your new deployment URL.

### Step 4: Test the Deployment

Open this URL in your browser (replace with your actual URL):
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getTests
```

You should see a JSON response like:
```json
{"success":true,"tests":[]}
```

If you see an error page or login prompt, your deployment permissions are wrong.

## Common Issues

### Issue 1: "Authorization Required" or Login Page
**Solution:** Redeploy with "Who has access" set to **Anyone**

### Issue 2: 404 Not Found
**Solution:** You're using the wrong URL. Get the deployment URL from "Manage deployments"

### Issue 3: CORS Error Even After Fixing Above
**Solution:** Make sure your `doGet` and `doPost` functions return proper responses:

```javascript
function doGet(e) {
  // Your code here
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Verification Checklist

- [ ] Google Apps Script is deployed as Web App
- [ ] "Execute as" is set to "Me"
- [ ] "Who has access" is set to "Anyone"
- [ ] Using the `/exec` URL (not `/dev`)
- [ ] SPREADSHEET_ID is correct in the script
- [ ] Test URL in browser shows JSON response
- [ ] Updated SCRIPT_URL in app.js

## Alternative: Test Without Backend

If you want to test the frontend without the backend working, I can create a mock data mode that doesn't require Google Apps Script.

## Need Help?

If you're still stuck after following these steps, please:
1. Share a screenshot of your Google Apps Script deployment settings
2. Test the script URL in your browser and share what you see
3. Check the Apps Script execution logs for errors

---

**Current Script URL:** `https://script.google.com/macros/s/AKfycbyEjbiOUWnG_2TUMzrVcIqEep9RJDQfmljjOOwLqi1Dj5l9VuqILkv4n9HXT-bQJq9Fgw/exec`

**Status:** ❌ Not accessible (404 error)
