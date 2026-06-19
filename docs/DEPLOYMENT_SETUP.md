# Deployment Setup

This is the minimum setup required to run Hermes locally and deploy it.

## Minimum required for local app boot

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
EXA_API_KEY=
EXA_WEBHOOK_SECRET=
ORANGESLICE_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_CHECKOUT_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Recommended launch-time envs

```bash
APIFY_API_TOKEN=
APOLLO_API_KEY=
HUNTER_API_KEY=
INSTANTLY_API_KEY=
AGENTMAIL_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Supabase

1. Create a new Supabase project
2. Run `supabase login`
3. Run `supabase link --project-ref <new-project-ref>`
4. Set `NEXT_PUBLIC_SUPABASE_URL`
5. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Set `SUPABASE_SERVICE_ROLE_KEY`
7. Run `supabase db push`
8. Confirm these tables exist and are writable:
   - `campaigns`
   - `subscriptions`
   - `usage_events`
   - `gmail_credentials`

If you only have the old 2025 backup, do not restore it directly into the new project and assume launch readiness. Apply the current migrations first, then selectively migrate only what still matters.

## Google OAuth

Hermes uses Supabase auth for Google sign-in and also has a Gmail connection flow.

Set:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=https://your-domain.com
```

Then verify:

- Supabase Google provider callback URLs
- `https://your-domain.com/auth/oauth`
- `https://your-domain.com/api/auth/gmail/callback`
- `http://localhost:3000/auth/oauth`
- `http://localhost:3000/api/auth/gmail/callback`

## Exa Webhook

Create or update the Exa webhook for production:

```text
https://gethermes.vercel.app/api/webhooks/exa
```

Subscribe to:

```text
webset.search.updated
webset.search.completed
webset.item.created
webset.item.enriched
webset.idle
```

Set the returned webhook signing secret as `EXA_WEBHOOK_SECRET` in Vercel. This is separate from `EXA_API_KEY`.

## Stripe

Set:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_CHECKOUT_URL=
```

Then:

1. Create the checkout flow
2. Point the webhook to `/api/stripe/webhook`
3. Verify subscription writes into `subscriptions`

## Redis

If you want rate limiting and cache in production:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

The cache layer also accepts:

```bash
REDIS_URL=
REDIS_TOKEN=
```

## Recommended launch stack

- Discovery: Exa Websets
- Enrichment: Orangeslice
- Draft review: Gmail
- Event/social demos: Apify, behind a feature flag
- Secondary enrichment: Apollo/Hunter only when keys and quotas are explicitly configured
- Post-launch sending scale: Instantly or AgentMail after the review-first flow is reliable

## Post-deploy smoke test

1. Sign up with Google
2. Confirm free credits are seeded
3. Run a prospect search
4. Confirm streamed results appear in the UI
5. Draft emails for review
6. Connect Gmail
7. Create and review a real Gmail draft
8. Trigger Stripe checkout
9. Verify webhook updates subscription state
