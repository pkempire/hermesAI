import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const provider = searchParams.get('provider')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  console.log('🔧 [OAuth] Request params:', { code: !!code, provider, next, allParams: Object.fromEntries(searchParams) })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Seed trial on first login if no subscription row
      try {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (userId) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle()
          if (!sub) {
            const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            await supabase
              .from('subscriptions')
              .insert({ user_id: userId, plan: 'starter', quota_monthly: 200, used_this_month: 0, trial_expires_at: trialEnd, metadata: { source: 'seeded_on_login' } })
          }
          // Capture provider tokens when available (depends on provider configuration)
          try {
            const { data: sessionData } = await supabase.auth.getSession()
            const providerAccess = (sessionData as any)?.session?.provider_token
            const providerRefresh = (sessionData as any)?.session?.provider_refresh_token
            if (providerAccess) {
              await supabase
                .from('gmail_credentials')
                .upsert({ user_id: userId, access_token: providerAccess, refresh_token: providerRefresh || null })
            }
          } catch {}
        }
      } catch {}

      // Preserve the current deployment's domain (important for preview branches)
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const host = request.headers.get('host') || new URL(request.url).host
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        // Use the current request's host to preserve preview deployment URLs
        // This ensures stable-sept-29 preview stays on stable-sept-29, not main
        const currentHost = forwardedHost || host
        const redirectUrl = `${protocol}://${currentHost}${next}`
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // return the user to an error page with instructions
  console.log('🔧 [OAuth] No code parameter, redirecting to error')

  // If provider=google was passed, try to initiate OAuth flow
  if (provider === 'google') {
    const supabase = await createClient()
    // Preserve current deployment domain for OAuth callback
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = request.headers.get('host') || new URL(request.url).host
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const currentHost = forwardedHost || host
    const callbackUrl = process.env.NODE_ENV === 'development' 
      ? `${origin}/auth/oauth`
      : `${protocol}://${currentHost}/auth/oauth`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        scopes: 'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send'
      }
    })

    if (data.url) {
      console.log('🔧 [OAuth] Redirecting to Google OAuth URL')
      return NextResponse.redirect(data.url)
    }

    console.log('🔧 [OAuth] Failed to get Google OAuth URL:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('Google OAuth not configured in Supabase')}`)
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
