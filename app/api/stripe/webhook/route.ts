/**
 * POST /api/stripe/webhook
 *
 * Authoritative subscription state syncs from Stripe → our `subscriptions`
 * table. The handler is idempotent and safe to retry.
 *
 * Events handled:
 *   checkout.session.completed       → mark active/trialing, record customer id
 *   customer.subscription.created    → ensure row exists, set status/trial end
 *   customer.subscription.updated    → flip status, update trial end / period
 *   customer.subscription.deleted    → mark canceled
 *   invoice.paid                     → flip plan to active, record has_paid
 *   invoice.payment_failed           → mark past_due
 *
 * The `subscriptions` table is keyed by user_id (one row per user). We resolve
 * user_id either from session.client_reference_id (checkout) or by reverse-
 * lookup on metadata.stripe_customer_id (subscription/invoice events).
 */

import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const MONTHLY_QUOTA = Number(process.env.STRIPE_MONTHLY_QUOTA ?? 1500)

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('stripe.webhook: STRIPE_WEBHOOK_SECRET missing — accepting all events as ok')
    return NextResponse.json({ ok: true })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.error('stripe.webhook: STRIPE_SECRET_KEY missing')
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let evt: Stripe.Event
  try {
    evt = Stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    logger.warn('stripe.webhook: signature verification failed', err?.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = await createClient()

  async function lookupUserIdByCustomer(customerId: string): Promise<string | null> {
    const { data: rows } = await supabase
      .from('subscriptions')
      .select('user_id, metadata')
      .contains('metadata', { stripe_customer_id: customerId } as any)
    return rows?.[0]?.user_id ?? null
  }

  function tsToIso(ts?: number | null): string | null {
    if (!ts || typeof ts !== 'number') return null
    try {
      return new Date(ts * 1000).toISOString()
    } catch {
      return null
    }
  }

  try {
    switch (evt.type) {
      case 'checkout.session.completed': {
        const s = evt.data.object as Stripe.Checkout.Session
        const userId = s.client_reference_id || s.metadata?.user_id
        const customerId =
          typeof s.customer === 'string' ? s.customer : s.customer?.id
        if (!userId) {
          logger.warn('stripe.webhook: checkout.session.completed without user_id')
          break
        }
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            plan: 'starter',
            quota_monthly: MONTHLY_QUOTA,
            metadata: customerId
              ? { stripe_customer_id: customerId, has_paid: false }
              : { has_paid: false }
          },
          { onConflict: 'user_id' }
        )
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = evt.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const userId =
          (sub.metadata && sub.metadata.user_id) ||
          (await lookupUserIdByCustomer(customerId))
        if (!userId) {
          logger.warn('stripe.webhook: subscription.* without resolvable user_id', {
            type: evt.type,
            customerId
          })
          break
        }
        const trialEnd = tsToIso(sub.trial_end)
        const isCanceled = sub.status === 'canceled' || evt.type === 'customer.subscription.deleted'
        await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              plan: isCanceled ? 'free' : sub.status === 'active' ? 'starter' : 'free',
              quota_monthly: isCanceled ? 0 : MONTHLY_QUOTA,
              trial_expires_at: trialEnd
            },
            { onConflict: 'user_id' }
          )
        // Merge metadata (don't blow away has_paid)
        const { data: row } = await supabase
          .from('subscriptions')
          .select('metadata')
          .eq('user_id', userId)
          .maybeSingle()
        const merged = {
          ...(row?.metadata || {}),
          stripe_customer_id: customerId,
          subscription_status: sub.status
        }
        await supabase.from('subscriptions').update({ metadata: merged }).eq('user_id', userId)
        break
      }

      case 'invoice.paid': {
        const inv = evt.data.object as Stripe.Invoice
        const customerId =
          typeof inv.customer === 'string' ? inv.customer : inv.customer?.id
        if (!customerId) break
        const userId = await lookupUserIdByCustomer(customerId)
        if (!userId) break
        const { data: row } = await supabase
          .from('subscriptions')
          .select('metadata')
          .eq('user_id', userId)
          .maybeSingle()
        const merged = {
          ...(row?.metadata || {}),
          stripe_customer_id: customerId,
          has_paid: true,
          last_paid_at: new Date().toISOString()
        }
        await supabase
          .from('subscriptions')
          .update({
            plan: 'starter',
            quota_monthly: MONTHLY_QUOTA,
            used_this_month: 0, // reset usage at the start of every paid period
            period_start: new Date().toISOString(),
            metadata: merged
          })
          .eq('user_id', userId)
        break
      }

      case 'invoice.payment_failed': {
        const inv = evt.data.object as Stripe.Invoice
        const customerId =
          typeof inv.customer === 'string' ? inv.customer : inv.customer?.id
        if (!customerId) break
        const userId = await lookupUserIdByCustomer(customerId)
        if (!userId) break
        const { data: row } = await supabase
          .from('subscriptions')
          .select('metadata')
          .eq('user_id', userId)
          .maybeSingle()
        const merged = {
          ...(row?.metadata || {}),
          stripe_customer_id: customerId,
          subscription_status: 'past_due'
        }
        await supabase.from('subscriptions').update({ metadata: merged }).eq('user_id', userId)
        break
      }

      default:
        // Unhandled event types are intentionally a no-op (200) so Stripe
        // stops retrying.
        break
    }
  } catch (err) {
    logger.error('stripe.webhook: handler error', err)
    return NextResponse.json({ error: 'handler-error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
