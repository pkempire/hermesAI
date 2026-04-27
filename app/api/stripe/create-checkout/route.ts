/**
 * POST /api/stripe/create-checkout
 *
 * Starts a Hermes monthly subscription Checkout Session for the current user.
 * The price and trial length are server-pinned via env so the client cannot
 * hand-craft a cheaper price.
 *
 * Trial behaviour:
 *  - First-time subscribers get TRIAL_DAYS days free (default 7, no card).
 *  - Returning subscribers (have a stored Stripe customer id with a prior
 *    paid subscription) skip the trial — Stripe enforces this when we omit
 *    `trial_period_days` and the customer already has an active subscription.
 */

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? 7)
const PRICE_ID = process.env.STRIPE_PRICE_ID

function getOrigin(req: NextRequest): string {
  // Prefer NEXT_PUBLIC_BASE_URL when explicitly configured (production).
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('Stripe is not configured: STRIPE_SECRET_KEY missing')
      return NextResponse.json(
        { error: 'Billing is not configured.' },
        { status: 503 }
      )
    }
    if (!PRICE_ID) {
      logger.error('Stripe is not configured: STRIPE_PRICE_ID missing')
      return NextResponse.json(
        { error: 'Billing price is not configured.' },
        { status: 503 }
      )
    }

    const userId = await getCurrentUserId()
    if (!userId || userId === 'anonymous') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const successPath = typeof body?.successPath === 'string' ? body.successPath : '/'
    const cancelPath = typeof body?.cancelPath === 'string' ? body.cancelPath : '/'

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any
    })

    // Look up existing Stripe customer for this user to keep one record per
    // identity (avoids duplicate customers on repeat checkout attempts).
    const supabase = await createClient()
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id, metadata')
      .eq('user_id', userId)
      .maybeSingle()

    const existingCustomer: string | undefined =
      typeof sub?.metadata === 'object' && sub?.metadata
        ? (sub.metadata as any).stripe_customer_id
        : undefined

    // Decide whether to offer the trial. If we already saw a paid subscription
    // for this user, do NOT add another trial (Stripe will also enforce this).
    const hasPaidBefore: boolean = !!(sub?.metadata && (sub.metadata as any).has_paid)

    const origin = getOrigin(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: userId,
      ...(existingCustomer ? { customer: existingCustomer } : {}),
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}${successPath}?checkout=success`,
      cancel_url: `${origin}${cancelPath}?checkout=cancel`,
      metadata: { user_id: userId },
      subscription_data: hasPaidBefore
        ? { metadata: { user_id: userId } }
        : {
            trial_period_days: TRIAL_DAYS,
            // If the customer never adds a card during the trial, cancel rather
            // than charging the saved card on file (no card required upfront).
            trial_settings: {
              end_behavior: { missing_payment_method: 'cancel' }
            },
            metadata: { user_id: userId }
          },
      // Don't require a card upfront. Stripe will collect on first invoice
      // (after trial). Lower friction = higher signup conversion.
      payment_method_collection: hasPaidBefore ? 'always' : 'if_required'
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error('stripe.create-checkout error', err)
    return NextResponse.json(
      { error: 'Failed to start checkout. Please try again.' },
      { status: 500 }
    )
  }
}
