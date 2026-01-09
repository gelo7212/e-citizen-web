# Token Rotation - Quick Verification Checklist

## Quick Test in Browser Console

Copy and paste this to verify token rotation is working:

```javascript
// Check 1: Are tokens stored?
console.log('Access Token:', !!localStorage.getItem('auth_token'));
console.log('Refresh Token:', !!localStorage.getItem('auth_refresh_token'));

// Check 2: Is the hook running? (Look for these messages)
// You should see: "[TokenRotation] Token refresh scheduled"
// In the browser console after login

// Check 3: Manual token refresh
fetch('/api/identity/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('auth_refresh_token'),
  }),
}).then(r => r.json()).then(d => {
  console.log('Refresh result:', d.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log(d);
});
```

## What You Did

I've **added `useTokenRotation` hook** to your layouts:

✅ **app/admin/layout.tsx** - Admin token refresh enabled
✅ **app/rescue/layout.tsx** - Rescue token refresh enabled

The hook will now:
1. Monitor token expiration every second
2. Refresh 60 seconds **before** expiration
3. Handle failures gracefully

## Verify It's Working

### Step 1: Login and Check Console
1. Log in to admin panel
2. Open DevTools (F12) → Console tab
3. You should see logs like:
```
[AdminLayout] 🟢 Token refreshed successfully
[TokenRotation] Token refresh scheduled
```

### Step 2: Check Network Requests
1. DevTools → Network tab
2. Look for `POST /api/identity/refresh` requests
3. You should see a refresh request ~60 seconds after login
4. Status should be **200** (not 401)

### Step 3: Verify Token Update
1. Before login: `localStorage.auth_token` = undefined
2. After login: `localStorage.auth_token` = "eyJ..." (long string)
3. After ~60s: `localStorage.auth_token` = different "eyJ..." (should change)

## Why It Wasn't Working Before

**Missing:** The `useTokenRotation()` hook call was **not in any layout file**.

The hook was implemented correctly in `/hooks/useTokenRotation.ts`, but **nothing was calling it**.

**Now fixed in:**
- ✅ app/admin/layout.tsx
- ✅ app/rescue/layout.tsx

## Expected Behavior Timeline

```
0s:  User logs in
     ↓
     Tokens stored in localStorage
     useTokenRotation hook activated
     
60s: Hook checks: "Token expires in 120 seconds"
     Time to refresh? 120s - 60s = 60s threshold ✓
     Schedules refresh for "60s from now"
     
120s: Refresh executes
      ✅ POST /api/identity/refresh called
      ✅ New tokens received
      ✅ localStorage updated
      ✅ Next refresh scheduled
      
180s-240s: Repeat...
```

## If Still Not Working

**Check these in order:**

1. **Console has no errors?**
   - DevTools → Console tab
   - Look for red error messages
   - Fix any TypeScript or network errors

2. **Layout file imported the hook?**
   - Check: `import { useTokenRotation } from '@/hooks/useTokenRotation';`
   - Add if missing

3. **Hook is called?**
   - Check: `useTokenRotation({ enabled: ... })`
   - Make sure it's in the component body, not conditionally

4. **Tokens exist in storage?**
   - DevTools → Application → Storage → Local Storage
   - Should have: auth_token, auth_refresh_token, auth_user

5. **Refresh endpoint working?**
   - Manual test in console (see above)
   - Check endpoint returns `{ success: true, data: { accessToken, refreshToken, expiresIn } }`

## Token Rotation Flow

```mermaid
User Logs In
    ↓
Exchange Firebase Token
    ↓
Store: auth_token (access), auth_refresh_token (refresh)
    ↓
useTokenRotation Hook Activates
    ↓
Check Token Expiration Every 1 Second
    ↓
Time to Expiration < 60 seconds?
    ├─ NO: Schedule refresh for (exp - 60s)
    └─ YES: Refresh immediately
        ↓
        POST /api/identity/refresh
            Headers: Authorization: Bearer {access_token}
            Body: { refreshToken }
        ↓
        Receive new tokens
        ↓
        Update localStorage
        ↓
        Reschedule next refresh
```

## Files Modified

1. **lib/auth/store.ts**
   - Added `getRefreshToken()`
   - Added `updateAccessToken()`
   - Added `updateTokens()`
   - Updated `setAuth()` to accept refresh token

2. **lib/services/authService.ts**
   - Updated `refreshAccessToken()` to:
     - Include Authorization header ✅
     - Send current access token in header ✅
     - Send refresh token in body ✅
     - Handle 401 responses ✅

3. **hooks/useTokenRotation.ts**
   - Rewrote to actively monitor token expiration ✅
   - Schedule refresh before expiration ✅
   - Handle errors and callbacks ✅

4. **lib/api/client.ts**
   - Improved interceptor for 401 handling ✅
   - Queue requests during refresh ✅
   - Execute queued requests after refresh ✅

5. **app/admin/layout.tsx**
   - Added `useTokenRotation()` call ✅

6. **app/rescue/layout.tsx**
   - Added `useTokenRotation()` call ✅

## Next Steps

1. ✅ Restart your dev server: `npm run dev`
2. ✅ Clear browser cache (DevTools → Network → Disable cache)
3. ✅ Log in again
4. ✅ Check console for "[TokenRotation]" messages
5. ✅ Verify Network tab shows `/api/identity/refresh` requests

That's it! Token rotation should now be working automatically.
