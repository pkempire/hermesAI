import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

export interface QuotaCheckOptions {
  userId: string
  cost: number
  kind: string
  idempotencyKey?: string
}

export type QuotaResult =
  | { ok: true }
  | { ok: false; reason: string; code: 'no_subscription' | 'trial_expired' | 'quota_exceeded' | 'reservation_failed' }

/**
 * Atomic-ish quota check + usage reservation.
 *
 * Order of decisions:
 *  1. Dev bypass (NODE_ENV=development OR SKIP_QUOTA_CHECK=true)
 *  2. No subscription row → deny with `no_subscription` (caller should kick to checkout)
 *  3. Trial row past trial_expires_at AND not paid → `trial_expired`
 *  4. used + cost > quota → `quota_exceeded`
 *  5. Reserve via usage_events (idempotent) and bump used_this_month.
 */
export async function requireQuota({
  userId,
  cost,
  kind,
  idempotencyKey
}: QuotaCheckOptions): Promise<QuotaResult> {
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_QUOTA_CHECK === 'true') {
    return { ok: true }
  }

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, quota_monthly, used_this_month, trial_expires_at, metadata')
    .eq('user_id', userId)
    .maybeSingle()

  if (!sub) {
    return {
      ok: false,
      reason: 'No active subscription. Start your free 30-day trial.',
      code: 'no_subscription'
    }
  }

  const hasPaid = !!(sub.metadata && (sub.metadata as any).has_paid)
  const trialEnd = sub.trial_expires_at ? new Date(sub.trial_expires_at).getTime() : null
  const now = Date.now()

  if (!hasPaid && trialEnd && now > trialEnd) {
    return {
      ok: false,
      reason: 'Your free trial has ended. Upgrade to keep running campaigns.',
      code: 'trial_expired'
    }
  }

  const quota = sub.quota_monthly ?? 0
  const used = sub.used_this_month ?? 0
  if (quota <= 0) {
    return {
      ok: false,
      reason: 'No credits remaining on your plan.',
      code: 'quota_exceeded'
    }
  }
  if (used + cost > quota) {
    return {
      ok: false,
      reason: 'Monthly credit quota exceeded.',
      code: 'quota_exceeded'
    }
  }

  // Idempotency check — if we've already recorded this key, skip the increment
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('usage_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing) return { ok: true }
  }

  const { error: ueErr } = await supabase
    .from('usage_events')
    .insert({ user_id: userId, amount: cost, kind, idempotency_key: idempotencyKey })
  if (ueErr) {
    logger.warn('requireQuota: usage_events insert failed', ueErr.message)
    return { ok: false, reason: 'Failed to reserve quota', code: 'reservation_failed' }
  }

  const { error: upErr } = await supabase
    .from('subscriptions')
    .update({ used_this_month: used + cost })
    .eq('user_id', userId)
  if (upErr) {
    logger.warn('requireQuota: subscriptions update failed', upErr.message)
    return { ok: false, reason: 'Failed to update subscription usage', code: 'reservation_failed' }
  }

  return { ok: true }
}
