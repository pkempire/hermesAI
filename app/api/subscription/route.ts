import { NextRequest, NextResponse } from 'next/server'

import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/subscription
 *
 * Returns the current user's subscription snapshot. Used by the header credit
 * pill, the trial banner, and the upgrade CTA.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) return auth.response

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, quota_monthly, used_this_month, trial_expires_at, metadata')
      .eq('user_id', auth.userId)
      .maybeSingle()

    const quota = data?.quota_monthly ?? 0
    const used = data?.used_this_month ?? 0
    const remaining = Math.max(0, quota - used)
    const hasPaid = !!(data?.metadata && (data.metadata as any).has_paid)
    const trialEndIso = data?.trial_expires_at || null
    const trialEnd = trialEndIso ? new Date(trialEndIso).getTime() : null
    const now = Date.now()
    const daysRemaining =
      trialEnd && !hasPaid
        ? Math.max(0, Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000)))
        : null
    const status: 'trialing' | 'active' | 'expired' | 'none' = !data
      ? 'none'
      : hasPaid
      ? 'active'
      : trialEnd && now > trialEnd
      ? 'expired'
      : 'trialing'

    return NextResponse.json({
      plan: data?.plan ?? 'none',
      remaining,
      quota_monthly: quota,
      used_this_month: used,
      trial_expires_at: trialEndIso,
      trial_days_remaining: daysRemaining,
      has_paid: hasPaid,
      status
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load subscription' },
      { status: 500 }
    )
  }
}
