import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ ok: true })

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let evt: Stripe.Event
  try {
    evt = Stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = await createClient()

  switch (evt.type) {
    case 'checkout.session.completed': {
      const s = evt.data.object as any
      const userId = s.client_reference_id || s.metadata?.user_id
      const customerId = s.customer as string
      // Prefer Stripe subscription trial_end when present; else default 7 days
      let trialEnd: string | null = null
      if (s.subscription && s.subscription.trial_end) {
        try { trialEnd = new Date(s.subscription.trial_end * 1000).toISOString() } catch {}
      }
      if (!trialEnd) {
        trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      if (userId) {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan: 'starter',
          quota_monthly: 200,
          trial_expires_at: trialEnd,
          metadata: { stripe_customer_id: customerId }
        }, { onConflict: 'user_id' })
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
    case 'customer.subscription.deleted': {
      const sub = evt.data.object as any
      const customerId = sub.customer as string
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
      // Lookup user by metadata if you store mapping elsewhere; here we store on subscriptions
      const { data: rows } = await supabase.from('subscriptions').select('user_id, metadata').contains('metadata', { stripe_customer_id: customerId } as any)
      const userId = rows?.[0]?.user_id
      if (userId) {
        await supabase.from('subscriptions').update({
          plan: sub.status === 'active' ? 'starter' : 'free',
          trial_expires_at: trialEnd
        }).eq('user_id', userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
