# Hermes Launch TODO

This is the production-hardening checklist for the current `main` branch. Only mark items done after verifying them in the running app or deployment.

## Done in this pass

- [x] Confirm `main` is the live source of truth and `dev-clean` is stale
- [x] Keep the pushed Hermes UI refresh on `main`
- [x] Consolidate prospect normalization so the streaming path uses the same mapper as preview/results
- [x] Remove the dead `/api/prospect-search/status` implementation and leave a clear `410 Gone`
- [x] Align `.env.example` with the runtime env names the app actually uses
- [x] Fix Redis cache config so Upstash-only setups work without a separate `REDIS_URL`

## Must finish before launch

- [ ] Recreate a working Supabase project and apply all migrations cleanly
- [ ] Verify Google OAuth in Supabase with the exact production callback URLs
- [ ] Verify Gmail connect flow end to end and confirm tokens persist in `gmail_credentials`
- [ ] Run a full happy-path manual test: sign up -> search -> review prospects -> draft emails -> connect Gmail -> send
- [ ] Run a quota/billing test: free credits, exhaustion, upgrade, post-upgrade credits
- [ ] Add production error monitoring (Sentry or equivalent) for server routes and client crashes
- [ ] Remove or downgrade noisy `console.log` debugging from auth, quota, cache, and prospect routes
- [ ] Audit all public pages for mobile polish, broken states, and loading/error empty states
- [ ] Confirm Stripe webhook signing and subscription writes in production
- [ ] Confirm all required env vars are present in Vercel production and preview

## Strongly recommended this week

- [ ] Add 3-5 Playwright smoke tests for auth, prospect search, campaign view, and billing CTA
- [ ] Unify Gmail auth so Supabase Google OAuth and the custom Gmail callback are intentionally documented, not accidental overlap
- [ ] Replace localStorage-only campaign history with persisted server-backed history where it matters
- [ ] Add a canonical onboarding path that gets a new user to first prospects in under 2 minutes
- [ ] Tighten analytics around activation: signup, first search, first drafted email, first sent email, upgrade click
- [ ] Add a real enrichment provider behind a feature flag for higher-confidence person/company data

## Product and architecture follow-ups

- [ ] Collapse duplicate prospecting docs and remove outdated architecture notes
- [ ] Decide the canonical enrichment stack: Exa/orangeslice for discovery, one provider for person/company enrichment, Hunter for verification only
- [ ] Define one core launch workflow and hide non-essential features until it is reliable
- [ ] Add an operator runbook for failed search jobs, broken OAuth, and Stripe sync issues
