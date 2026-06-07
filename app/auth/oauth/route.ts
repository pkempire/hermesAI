import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const provider = searchParams.get('provider')
  const next = searchParams.get('next') ?? '/'
  const invite = searchParams.get('invite')?.trim()

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
            // First sign-in: provision the 7-day no-card trial automatically
            // so the user can use the product immediately. Webhook will
            // overwrite this row with `starter` + stripe_customer_id once
            // they actually enter checkout. Override via STRIPE_TRIAL_DAYS
            // env if you ever need to extend it for a cohort.
            const inviteCode =
              invite && /^[a-z0-9_-]{3,40}$/i.test(invite) ? invite : null
            const trialDays = inviteCode
              ? 30
              : Number(process.env.STRIPE_TRIAL_DAYS ?? 7)
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
                invite_code: inviteCode,
                metadata: {
                  source: 'auto_trial_on_signup',
                  trial_started_at: new Date().toISOString(),
                  invite_code: inviteCode
                }
              })
          }
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
        scopes: 'openid email profile',
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
