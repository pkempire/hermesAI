# Testing & Debugging Strategy for HermesAI

## Current Issues

1. **Credits not applying** - Fixed: Now gives 100 credits on signup (no trial complexity)
2. **OAuth goes to wrong Google account** - Fixed: Added `prompt: 'select_account'` to force account selection
3. **UI version confusion** - Need to clear browser cache and verify branch deployments

## Quick Fixes Applied

### 1. Simplified Credits System
- **Before**: 200 credits with 7-day trial expiration
- **After**: 100 credits on signup, no trial expiration
- **Files changed**:
  - `app/auth/oauth/route.ts` - Changed to `quota_monthly: 100`, `plan: 'free'`, removed `trial_expires_at`
  - `lib/utils/quota.ts` - Removed trial logic, simplified to just check `quota_monthly`

### 2. Fixed OAuth Account Selection
- Added `prompt: 'select_account'` to all OAuth calls
- This forces Google to show account picker instead of auto-selecting
- **Files changed**:
  - `app/auth/oauth/route.ts`
  - `components/login-form.tsx`
  - `components/sign-up-form.tsx`

### 3. Enhanced OAuth Logging
- Added detailed logging to track OAuth flow
- Logs include: URL, headers, user agent, callback URLs
- Check server logs for `🔧 [OAuth]` messages

## Testing Steps

### Local Development Testing

1. **Clear everything**:
```bash
# Clear browser cache (Chrome: Cmd+Shift+Delete)
# Or use Incognito/Private window

# Clear Supabase local session
# In browser console on localhost:3000:
localStorage.clear()
sessionStorage.clear()
```

2. **Start fresh**:
```bash
# Make sure you're on the right branch
git checkout main
git pull origin main

# Clear node_modules and reinstall if needed
rm -rf .next
npm run dev
```

3. **Test signup flow**:
   - Go to `http://localhost:3000/auth/sign-up`
   - Sign up with email/password OR click "Sign In with Google"
   - **Expected**: Google shows account picker (not auto-selecting)
   - **Expected**: After OAuth, redirected to `/` with 100 credits
   - **Check**: Open browser console, look for `🔧 [OAuth]` logs
   - **Check**: In Supabase dashboard → Authentication → Users, verify user created
   - **Check**: In Supabase dashboard → Table Editor → `subscriptions`, verify row with `quota_monthly: 100`

4. **Test login flow**:
   - Go to `http://localhost:3000/auth/login`
   - Click "Sign In with Google"
   - **Expected**: Google shows account picker
   - **Expected**: After OAuth, redirected to `/` 
   - **Check**: Browser console logs show correct user email

5. **Test credits**:
   - After login, try a prospect search
   - **Expected**: Search works (credits are consumed)
   - **Check**: In Supabase → `subscriptions` table, `used_this_month` should increment

### Production/Preview Testing

1. **Verify branch deployments**:
   - Main branch: `https://gethermes.vercel.app`
   - Stable branch: Check Vercel dashboard for `stable-sept-29` preview URL

2. **Test on preview deployment**:
   - Use Incognito window
   - Go to preview URL (e.g., `https://hermesai-git-stable-sept-29-...vercel.app`)
   - Sign in with Google
   - **Expected**: Stay on preview URL (not redirect to main)
   - **Check**: URL bar shows preview domain throughout OAuth flow

3. **Debug OAuth redirects**:
   - Check Vercel function logs for `🔧 [OAuth]` messages
   - Verify `redirectTo` URLs in logs match the preview domain
   - If redirecting to wrong domain, check Supabase Redirect URLs config

## Debugging OAuth Issues

### Wrong Google Account Selected

**Symptoms**: Google auto-selects wrong account instead of showing picker

**Fixes Applied**:
- Added `prompt: 'select_account'` to OAuth calls
- This forces account selection screen

**If still happening**:
1. Clear browser cookies for `accounts.google.com`
2. Clear Supabase session: `localStorage.clear()` in console
3. Check Supabase dashboard → Authentication → URL Configuration
   - Ensure `Site URL` matches your deployment
   - Ensure Redirect URLs include your domain

### UI Version Confusion

**Symptoms**: After login, seeing old UI or wrong version

**Causes**:
- Browser cache serving old JavaScript
- Wrong branch deployed
- Service worker caching old assets

**Fixes**:
1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Clear cache**: Browser settings → Clear browsing data → Cached images/files
3. **Check deployment**: Vercel dashboard → Verify correct branch is deployed
4. **Disable service worker**: Chrome DevTools → Application → Service Workers → Unregister

### Credits Not Applying

**Symptoms**: User signs up but has 0 credits

**Debug steps**:
1. Check Supabase → `subscriptions` table:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = '<user-id>';
   ```
2. Check server logs for `🔧 [OAuth] Creating new subscription` message
3. Verify OAuth callback is completing (check `app/auth/oauth/route.ts` logs)
4. If subscription row missing, manually insert:
   ```sql
   INSERT INTO subscriptions (user_id, plan, quota_monthly, used_this_month)
   VALUES ('<user-id>', 'free', 100, 0);
   ```

## Environment Variables Checklist

Make sure these are set in `.env.local` (local) and Vercel (production):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Development bypasses
SKIP_QUOTA_CHECK=true  # Only for local dev
NODE_ENV=development   # Only for local dev

# Base URL (for production)
NEXT_PUBLIC_BASE_URL=https://gethermes.vercel.app
```

## Supabase Configuration

### Redirect URLs (Critical!)

In Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL**: `https://gethermes.vercel.app`
2. **Redirect URLs** (add all):
   - `http://localhost:3000/auth/oauth`
   - `https://gethermes.vercel.app/auth/oauth`
   - `https://*.vercel.app/auth/oauth` (wildcard for preview branches)

### Google OAuth Setup

In Supabase Dashboard → Authentication → Providers → Google:

1. Enable Google provider
2. Add OAuth credentials (Client ID, Client Secret)
3. **Authorized redirect URIs** in Google Cloud Console:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - This is handled by Supabase, you don't need to add your app URLs here

## Common Issues & Solutions

### Issue: "Redirect URI mismatch"

**Solution**: Check Supabase Redirect URLs includes your exact domain (with/without trailing slash matters)

### Issue: "OAuth callback goes to wrong domain"

**Solution**: 
- Check `app/auth/oauth/route.ts` logs for `callbackUrl` value
- Verify `x-forwarded-host` header is being read correctly
- For localhost, ensure `NODE_ENV=development` is set

### Issue: "Credits not showing up"

**Solution**:
- Check `subscriptions` table has row for user
- Verify `quota_monthly: 100` (not 200)
- Check `used_this_month` is 0 (not negative)
- Verify RLS policies allow user to read their subscription

## Should We Start Fresh?

**Recommendation: NO** - The repo is fixable. Issues are:
1. ✅ Credits system - FIXED (simplified to 100 credits)
2. ✅ OAuth account selection - FIXED (added prompt)
3. ⚠️ UI caching - Browser cache issue, not code issue
4. ⚠️ Branch confusion - Deployment/config issue, not code issue

**If starting fresh, you'd lose**:
- All existing migrations
- Database schema
- Existing user data
- All the fixes we've made

**Better approach**: Fix the current repo, which we're doing now.

## Next Steps

1. ✅ Simplified credits to 100 on signup
2. ✅ Fixed OAuth account selection
3. ✅ Added better logging
4. ⏭️ Test locally with fresh browser session
5. ⏭️ Verify production deployment
6. ⏭️ Monitor logs for any OAuth issues

