# OAuth Linking Explained: Localhost vs Production

## Why They're "Linked"

**Short answer**: Both localhost and production use the **same Supabase project**, so they share the same OAuth configuration.

## How OAuth Works

1. **Your App** (localhost:3000 or production) → Initiates OAuth
2. **Supabase** (supabase.co) → Handles OAuth flow with Google
3. **Google** → User authenticates
4. **Supabase** → Redirects back to your app with auth code
5. **Your App** → Exchanges code for session

## The "Linking" Issue

When you sign in on localhost, you're using:
- **Supabase Project**: Same project as production
- **OAuth Provider**: Same Google OAuth credentials
- **Redirect URLs**: Configured in Supabase dashboard

This means:
- ✅ Same user accounts (auth.users table is shared)
- ✅ Same subscriptions (subscriptions table is shared)
- ✅ Same database (all data is shared)

## Why This Happens

Both environments use the same `.env` variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## The Redirect URL Configuration

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL**: `https://gethermes.vercel.app` (production)

**Redirect URLs** (must include both):
- `http://localhost:3000/auth/oauth` (for local dev)
- `https://gethermes.vercel.app/auth/oauth` (for production)
- `https://*.vercel.app/auth/oauth` (wildcard for preview branches)

## Why You See "Wrong Account"

This happens because:
1. **Browser cookies**: Google remembers which account you used last
2. **No account picker**: Without `prompt: 'select_account'`, Google auto-selects
3. **Shared session**: If you're logged into Google in the browser, it uses that

**Fix Applied**: Added `prompt: 'select_account'` to all OAuth calls to force account selection.

## Why UI Switches Between Versions

This is **NOT** an OAuth issue - it's a **browser cache** issue:

1. **Service Worker**: May cache old JavaScript
2. **Browser Cache**: May serve old CSS/JS files
3. **CDN Cache**: Vercel may serve cached assets

**Fix**: Hard refresh (`Cmd+Shift+R`) or clear browser cache.

## Testing Strategy

### Local Development
1. Use **Incognito/Private window** to avoid cookie confusion
2. Clear browser cache before testing
3. Check Supabase logs to see which domain initiated OAuth

### Production
1. Use **Incognito/Private window**
2. Verify redirect URLs in Supabase dashboard
3. Check Vercel function logs for OAuth callback URLs

## Key Takeaway

**Localhost and production are "linked" because they use the same Supabase backend.** This is actually **good** - you can test with real data. But you need to:

1. ✅ Configure redirect URLs for both domains
2. ✅ Use `prompt: 'select_account'` to avoid wrong account selection
3. ✅ Clear browser cache when testing different versions
4. ✅ Use Incognito mode to avoid cookie confusion

## If You Want Separate Environments

If you want **completely separate** localhost and production:

1. Create a **separate Supabase project** for development
2. Use different `.env.local` files:
   - `.env.local` → Development Supabase project
   - `.env.production` → Production Supabase project
3. This means separate databases, users, subscriptions

**Recommendation**: Keep them linked for easier testing, but use better debugging/logging (which we've added).

