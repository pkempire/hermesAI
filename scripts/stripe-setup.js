#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-shot Stripe setup.
 *
 * Creates (idempotently) the production Hermes product and its monthly price,
 * and prints the env vars to add to .env.local + Vercel.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.js
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.js
 *
 * Requires the `stripe` package, which is already a project dependency.
 * Re-run safely; finds existing product by metadata.hermes_plan = 'monthly'.
 */

const Stripe = require('stripe')

const SECRET = process.env.STRIPE_SECRET_KEY
if (!SECRET) {
  console.error('STRIPE_SECRET_KEY env var is required.')
  process.exit(1)
}

const stripe = new Stripe(SECRET, { apiVersion: '2024-12-18.acacia' })

const PRODUCT_NAME = 'Hermes — AI Outbound Operator'
const PRODUCT_TAG = 'hermes_plan'
const TIER = 'monthly'
const UNIT_AMOUNT_CENTS = 4000 // $40.00
const CURRENCY = 'usd'
const TRIAL_DAYS = 30

async function findOrCreateProduct() {
  // Stripe doesn't allow filtering Product list by metadata directly via the
  // API, so we paginate the active products and match locally.
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    if (product.metadata && product.metadata[PRODUCT_TAG] === TIER) {
      return product
    }
  }
  return stripe.products.create({
    name: PRODUCT_NAME,
    description:
      'AI-powered outbound operator: discovery, decision-maker resolution, ' +
      'evidence-backed drafts, Gmail-native sending. 30-day free trial.',
    metadata: { [PRODUCT_TAG]: TIER }
  })
}

async function findOrCreateMonthlyPrice(productId) {
  for await (const price of stripe.prices.list({ product: productId, active: true, limit: 100 })) {
    if (
      price.unit_amount === UNIT_AMOUNT_CENTS &&
      price.currency === CURRENCY &&
      price.recurring &&
      price.recurring.interval === 'month'
    ) {
      return price
    }
  }
  return stripe.prices.create({
    product: productId,
    unit_amount: UNIT_AMOUNT_CENTS,
    currency: CURRENCY,
    recurring: { interval: 'month' },
    nickname: 'Hermes Monthly',
    metadata: { tier: TIER }
  })
}

async function main() {
  const product = await findOrCreateProduct()
  const price = await findOrCreateMonthlyPrice(product.id)

  console.log('')
  console.log('  Hermes Stripe setup complete')
  console.log('  ' + '─'.repeat(60))
  console.log(`  Product : ${product.id}  (${product.name})`)
  console.log(`  Price   : ${price.id}  ($${(UNIT_AMOUNT_CENTS / 100).toFixed(2)} ${CURRENCY.toUpperCase()} / month)`)
  console.log(`  Trial   : ${TRIAL_DAYS} days`)
  console.log('')
  console.log('  Add these to .env.local and Vercel:')
  console.log('  ' + '─'.repeat(60))
  console.log(`    STRIPE_PRICE_ID=${price.id}`)
  console.log(`    STRIPE_PRODUCT_ID=${product.id}`)
  console.log(`    STRIPE_TRIAL_DAYS=${TRIAL_DAYS}`)
  console.log('')
  console.log('  Webhook target (configure in Stripe Dashboard → Developers → Webhooks):')
  console.log('  ' + '─'.repeat(60))
  console.log('    URL    : https://YOUR_DOMAIN/api/stripe/webhook')
  console.log('    Events : checkout.session.completed,')
  console.log('             customer.subscription.created,')
  console.log('             customer.subscription.updated,')
  console.log('             customer.subscription.deleted,')
  console.log('             invoice.paid,')
  console.log('             invoice.payment_failed')
  console.log('  After saving, copy the signing secret to STRIPE_WEBHOOK_SECRET.')
  console.log('')
}

main().catch(err => {
  console.error('Stripe setup failed:', err.message || err)
  process.exit(1)
})
