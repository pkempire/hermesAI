import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const provider = searchParams.get('provider')
  const next = searchParams.get('next') ?? '/'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host') || new URL(request.url).host
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const currentHost = forwardedHost || host
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const appOrigin = isLocalEnv ? origin : `${protocol}://${currentHost}`
  const redirectTo = `${appOrigin}${next}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
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
            // First sign-in: provision the 30-day trial automatically so the
            // user can immediately use the product without going through
            // Stripe checkout. Webhook will overwrite this row with `starter`
            // + stripe_customer_id once they actually enter checkout.
            const trialDays = Number(process.env.STRIPE_TRIAL_DAYS ?? 30)
            const monthlyQuota = Number(process.env.STRIPE_MONTHLY_QUOTA ?? 1500)
            const trialEnd = new Date(
              Date.now() + trialDays * 24 * 60 * 60 * 1000
            ).toISOString()
            await supabase
              .from('subscriptions')
              .insert({
                user_id: userId,
                plan: 'starter',
                quota_monthly: monthlyQuota,
                used_this_month: 0,
                trial_expires_at: trialEnd,
                metadata: {
                  source: 'auto_trial_on_signup',
                  trial_started_at: new Date().toISOString()
                }
              })
          }
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

      return NextResponse.redirect(redirectTo)
    }
  }

  if (provider === 'google') {
    const supabase = await createClient()
    const callbackUrl = `${appOrigin}/auth/oauth`
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        scopes: 'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          prompt: 'select_account'
        }
      }
    })

    if (data.url) {
      return NextResponse.redirect(data.url)
    }

    const errorUrl = `${appOrigin}/auth/error?error=${encodeURIComponent(error?.message || 'Google OAuth not configured in Supabase')}`
    return NextResponse.redirect(errorUrl)
  }

  const errorUrl = `${appOrigin}/auth/error`
  return NextResponse.redirect(errorUrl)
}
