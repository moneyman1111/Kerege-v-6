# Kerege Synak Platform Scaling - Deployment Guide

## Overview
This guide walks you through deploying all the new features for the Kerege Synak platform.

## Phase 1: Backend Deployment (Google Apps Script)

### Step 1: Update Google Apps Script

1. Open your Google Apps Script project
2. Replace the entire content of `Code.gs` with the content from `google-apps-script.js`
3. Verify `SPREADSHEET_ID` is correct: `19haGRsvsWDXdVtdMSS6mB1IFgbCcsLbaN1_Ru1Oh7z0`
4. Click **Deploy → Manage deployments**
5. Click **Edit** on your existing deployment (or create new one)
6. Update version description: "v2.0 - Multiple photos, videos, certificates"
7. Click **Deploy**
8. Copy the new deployment URL

### Step 2: Update Google Sheets Structure

#### Results Sheet
1. Open your Google Sheets
2. Go to `Results` sheet
3. Add two new columns after `WhatsApp`:
   - Column E: `Region`
   - Column F: `ParentPhone`

#### Create Videos Sheet
1. Click **+** to add new sheet
2. Name it `Videos`
3. Add headers in row 1:
   - A1: `ID`
   - B1: `Title`
   - C1: `URL`
   - D1: `Language`
   - E1: `CreatedAt`

#### Update Tests Sheet
1. Go to `Tests` sheet
2. Column F header should be `PhotoURLs` (was `PhotoURL`)
3. Note: Old tests with single photo will still work
4. Add new column H: `FolderId`

## Phase 2: Frontend Updates

### Step 1: Update Configuration

1. Open `app.js`
2. Update line 4 with your new deployment URL:
   ```javascript
   SCRIPT_URL: 'YOUR_NEW_DEPLOYMENT_URL_HERE'
   ```

### Step 2: Apply HTML Updates

Follow instructions in `HTML_UPDATES.md`:

1. Add Video Section (after line 67)
2. Add About Company Section (after line 78)
3. Replace Lead Form Modal
4. Replace Admin Content section

**Quick Method:**
- Copy sections from `HTML_UPDATES.md`
- Paste into `index.html` at specified locations

### Step 3: Apply JavaScript Updates

Follow instructions in `JS_UPDATES.md`:

1. Add `loadVideos()` function
2. Add `displayVideos()` function
3. Add `setupParentPhoneMask()` function
4. Update `submitLeadForm()` function
5. Update `startTest()` function
6. Update `DOMContentLoaded` event listener

### Step 4: Apply CSS Updates

Follow instructions in `CSS_UPDATES.md`:

1. Add Video Section styles
2. Add About Company styles
3. Add Team Grid styles
4. Add Social CTA styles
5. Add Admin Panel updates
6. Add Responsive updates

## Phase 3: Testing

### Backend Testing

1. **Test getVideos:**
   ```
   https://YOUR_SCRIPT_URL/exec?action=getVideos
   ```
   Should return: `{"success":true,"videos":[]}`

2. **Test deleteTest:**
   - Upload a test via admin panel
   - Delete it
   - Verify it's removed from sheet and Drive folder is trashed

3. **Test Certificate Generation:**
   - Use admin panel certificate generator
   - Verify PDF is created and downloadable

### Frontend Testing

1. **Video Section:**
   - Add a video via admin panel
   - Refresh landing page
   - Verify video appears and plays

2. **Enhanced Registration:**
   - Select a test
   - Fill out form with region and parent phone
   - Submit test
   - Check Results sheet for new columns

3. **Multiple Photo Upload:**
   - Upload test with 10+ photos
   - Verify all photos are uploaded to Drive
   - Verify test works correctly

### Admin Panel Testing

1. **Delete Test:**
   - Delete a test
   - Verify it's removed from list
   - Check Drive folder is trashed

2. **Video Management:**
   - Add video
   - Delete video
   - Verify changes in Videos sheet

3. **Certificate Generator:**
   - Generate certificate
   - Download PDF
   - Verify formatting

## Phase 4: Production Checklist

### Update Contact Information

1. **About Section** (`index.html`):
   - Update social media links (Instagram, Telegram, WhatsApp)
   - Update phone number in "Позвонить сейчас" button

2. **Team Members** (`index.html`):
   - Replace placeholder names with real team members
   - Add real photos (optional)

### Performance Optimization

1. **Test with 40 Photos:**
   - Upload a test with maximum 40 photos
   - Verify upload completes successfully
   - Check load time is acceptable

2. **Video Loading:**
   - Add 5-10 videos
   - Verify page loads quickly
   - Test on mobile devices

### Security Verification

1. **Admin Panel:**
   - Verify password protection works
   - Test redirect on failed authentication
   - Verify hidden route `#keregemanager`

2. **Data Privacy:**
   - Verify student data is saved correctly
   - Check parent phone numbers are stored
   - Verify regions are recorded

## Troubleshooting

### Issue: 404 or CORS Errors

**Solution:**
1. Verify deployment URL is correct
2. Check deployment permissions are "Anyone"
3. Redeploy Google Apps Script

### Issue: Multiple Photos Not Uploading

**Solution:**
1. Check file size limits (Google Apps Script has 50MB limit)
2. Verify Drive folder permissions
3. Check browser console for errors

### Issue: Videos Not Displaying

**Solution:**
1. Verify YouTube URLs are correct
2. Check Videos sheet structure
3. Verify `loadVideos()` is called on page load

### Issue: Certificate PDF Not Generating

**Solution:**
1. Check Google Apps Script logs
2. Verify Drive folder exists
3. Check certificate data is valid

## Rollback Plan

If something goes wrong:

1. **Backend:** Use "Manage deployments" to revert to previous version
2. **Frontend:** Use git to revert changes:
   ```bash
   git checkout HEAD~1 index.html app.js admin.js styles.css
   ```

## Next Steps

After successful deployment:

1. **Monitor Results Sheet:**
   - Check that region and parent phone data is being saved

2. **Gather Feedback:**
   - Test with real users
   - Collect feedback on new features

3. **Future Enhancements:**
   - Photo carousel for multiple test images
   - Video categories/filtering
   - Certificate templates
   - Analytics dashboard

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Google Apps Script execution logs
3. Review `TROUBLESHOOTING.md`
4. Verify all update files were applied correctly

---

**Files Updated:**
- ✅ `google-apps-script.js` - Complete rewrite
- ✅ `admin.js` - Complete rewrite
- 📝 `index.html` - Manual updates required (see HTML_UPDATES.md)
- 📝 `app.js` - Manual updates required (see JS_UPDATES.md)
- 📝 `styles.css` - Manual updates required (see CSS_UPDATES.md)

**New Features:**
- ✅ Multiple photo upload (up to 40)
- ✅ Video management
- ✅ Certificate generator
- ✅ Delete tests
- ✅ Region tracking
- ✅ Parent phone collection
- ✅ About company section
- ✅ Team showcase
