# Admin Panel Security Update

## Changes Made

### Hidden Admin Route: `#keregemanager`

The admin panel is now completely hidden from regular users and only accessible via a secret URL hash.

**Access URL:**
```
index.html#keregemanager
```

### Security Features

1. **No Menu Link**: The admin panel does not appear in any navigation menu
2. **Password Gate**: Immediate fullscreen password prompt when accessing `#keregemanager`
3. **Auto-Redirect on Failure**: 
   - Wrong password → Redirects to landing page
   - Close/Cancel login → Redirects to landing page
   - URL hash is cleared automatically
4. **Session Reset**: Authentication resets when navigating away from admin route

### Updated Files

- **app.js**: Changed route from `#admin` to `#keregemanager`
- **admin.js**: Added `redirectToLanding()` security gate function
- **index.html**: Updated admin panel back button to use security function

### How It Works

1. User navigates to `website.com/#keregemanager`
2. System detects the hash and shows admin page
3. Fullscreen password prompt appears immediately
4. User enters password:
   - ✅ **Correct** (`Kerege2026`): Admin interface unlocks
   - ❌ **Incorrect**: Alert shown, then auto-redirect to landing page
   - ❌ **Cancel/Close**: Auto-redirect to landing page
5. URL hash is cleared on failed auth, preventing access

### Testing

To test the security:

1. Navigate to `index.html#keregemanager`
2. Try wrong password → Should redirect to landing
3. Try correct password (`Kerege2026`) → Should show admin panel
4. Click "На главную" → Should return to landing and clear auth

### Important Notes

- Password is still stored in plain text in `admin.js`
- For production, consider server-side authentication
- The route name `#keregemanager` should be kept secret
- Only share this URL with authorized administrators
