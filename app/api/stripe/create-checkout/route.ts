import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { priceId, successPath = '/', cancelPath = '/' } = await req.json()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any })
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: userId,
    customer_email: undefined, // Stripe links user by future webhooks
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}${successPath}?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}${cancelPath}?checkout=cancel`,
    subscription_data: { trial_period_days: 7 }
  })
  return NextResponse.json({ url: session.url })
}


