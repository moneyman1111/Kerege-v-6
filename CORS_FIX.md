# CORS Fix for Google Apps Script

## Issue
Google Apps Script requires specific handling for CORS (Cross-Origin Resource Sharing) when making POST requests from the frontend.

## Solution Applied

### Changes Made

**1. admin.js - uploadTest function (Line 123-133)**
- ✅ Removed `Content-Type: application/json` header
- ✅ Added comment explaining CORS preflight avoidance
- Kept JSON.stringify for body data

**2. app.js - submitTest function (Line 305-315)**
- ✅ Removed `Content-Type: application/json` header  
- ✅ Added comment explaining CORS preflight avoidance
- Kept JSON.stringify for body data

## Why This Works

When you include `Content-Type: application/json`, the browser triggers a **CORS preflight request** (OPTIONS method) before the actual POST request. Google Apps Script's web app deployment doesn't always handle preflight requests correctly.

By removing the `Content-Type` header:
- The browser sends the request as `text/plain` (default)
- No preflight request is triggered
- Google Apps Script still receives and parses the JSON data correctly via `JSON.parse(e.postData.contents)`

## Testing

After these changes, you should be able to:
1. Upload tests from the admin panel without CORS errors
2. Submit student test results without CORS errors

## Alternative (if still having issues)

If you still encounter CORS issues, you can add `mode: 'no-cors'` to the fetch options:

```javascript
const response = await fetch(CONFIG.SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',  // Add this line
    body: JSON.stringify({...})
});
```

**Note:** With `mode: 'no-cors'`, you won't be able to read the response, so you'll need to assume success if no error is thrown.

## Current Configuration

✅ Google Apps Script URL configured: `https://script.google.com/macros/s/AKfycbw5OeJk5LXPhEZl9X2i5x2SutdiLldyXcY1mUYiIr0NbA2ckT78jvJ0Ko2EKZ9brrrNwg/exec`

✅ Spreadsheet ID configured: `19haGRsvsWDXdVtdMSS6mB1IFgbCcsLbaN1_Ru1Oh7z0`

The application is now ready to test!
