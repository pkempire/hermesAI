import { createClient } from '@/lib/supabase/server'

export interface QuotaCheckOptions {
  userId: string
  cost: number
  kind: string
  idempotencyKey?: string
}

export async function requireQuota({ userId, cost, kind, idempotencyKey }: QuotaCheckOptions): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = await createClient()

  // Fetch subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const now = new Date()
  const inTrial = sub?.trial_expires_at ? new Date(sub.trial_expires_at) > now : false
  const quota = sub?.quota_monthly ?? (inTrial ? 200 : 0)
  const used = sub?.used_this_month ?? 0

  if (!inTrial && quota <= 0) {
    return { ok: false, reason: 'No active plan. Start trial or subscribe.' }
  }
  if (used + cost > quota) {
    return { ok: false, reason: 'Monthly quota exceeded.' }
  }

  // Record usage event idempotently
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('usage_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing) return { ok: true }
  }

  // Insert usage event and update running tally
  const { error: ue } = await supabase
    .from('usage_events')
    .insert({ user_id: userId, amount: cost, kind, idempotency_key: idempotencyKey })
  if (ue) return { ok: false, reason: 'Failed to reserve quota' }

  const { error: up } = await supabase
    .from('subscriptions')
    .update({ used_this_month: used + cost })
    .eq('user_id', userId)
  if (up) return { ok: false, reason: 'Failed to update subscription usage' }

  return { ok: true }
}


