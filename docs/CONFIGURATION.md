# Configuration

Hermes needs four systems to run the launch flow:

- Supabase for auth, user data, campaign state, and webhook-backed workflow state.
- OpenAI or Anthropic for planning, scoring, and draft generation.
- Exa Websets for live account discovery.
- Orangeslice for company/person/contact enrichment.

Optional providers such as Apify, Apollo, Hunter, Instantly, and AgentMail should stay disabled until you are intentionally testing those paths.

## Required

```bash
# App URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Models
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Discovery
EXA_API_KEY=
EXA_WEBHOOK_SECRET=

# Enrichment
ORANGESLICE_API_KEY=

# Google auth / Gmail drafts
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
STRIPE_PRODUCT_ID=
STRIPE_TRIAL_DAYS=30
STRIPE_MONTHLY_QUOTA=1500
```

`EXA_WEBHOOK_SECRET` is not the same thing as `EXA_API_KEY`. The API key lets Hermes create and read Websets. The webhook secret lets Hermes verify events that Exa sends back to `/api/webhooks/exa`.

## Production URLs

Set production URLs to the real domain:

```bash
NEXT_PUBLIC_SITE_URL=https://gethermes.vercel.app
NEXT_PUBLIC_BASE_URL=https://gethermes.vercel.app
NEXTAUTH_URL=https://gethermes.vercel.app
```

Keep localhost URLs only in `.env.local` and Supabase local/dev redirect settings.

## Exa Webhook

Create one webhook per deployed environment:

- Production URL: `https://gethermes.vercel.app/api/webhooks/exa`
- Preview URL, if you test previews: `https://<preview-domain>/api/webhooks/exa`
- Local URL only if you expose localhost through a tunnel.

Subscribe to:

```text
webset.search.updated
webset.search.completed
webset.item.created
webset.item.enriched
webset.idle
```

Save the secret returned by Exa as `EXA_WEBHOOK_SECRET` for that environment.

## Optional

```bash
# Event/social scraping demos
APIFY_API_TOKEN=

# Explicit secondary enrichment providers only
APOLLO_API_KEY=
APOLLO_PHONE_WEBHOOK_URL=
HUNTER_API_KEY=

# Post-launch send volume / inbox automation
INSTANTLY_API_KEY=
AGENTMAIL_API_KEY=

# Redis cache / rate limits
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
REDIS_TOKEN=
```

## Feature Flags

```bash
SKIP_QUOTA_CHECK=false
NEXT_PUBLIC_ENABLE_SAVE_CHAT_HISTORY=true
NEXT_PUBLIC_ENABLE_SHARE=true
```

Do not enable `SKIP_QUOTA_CHECK` outside local development.
