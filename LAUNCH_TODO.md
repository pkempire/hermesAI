# Hermes Launch TODO

This is the launch source of truth for the current `main` branch. The target is a deployable Gmail-first Hermes release that can sign users up, find prospects, draft outreach, and send through connected Gmail.

Only mark items done after verifying them in the running app or production environment.

## Done in this pass

- [x] Confirm `main` is the live source of truth and `dev-clean` is stale
- [x] Keep the Hermes UI refresh on `main`
- [x] Consolidate prospect normalization so the streaming path uses the same mapper as preview/results
- [x] Remove the dead `/api/prospect-search/status` implementation and leave a clear `410 Gone`
- [x] Align `.env.example` with the runtime env names the app actually uses
- [x] Fix Redis cache config so Upstash-only setups work without a separate `REDIS_URL`
- [x] Refresh expired Gmail access tokens before draft/send calls
- [x] Make Google the primary auth entry point in login and sign-up UX
- [x] Audit the old Supabase backup and confirm it is mostly auth state, not meaningful app data
- [x] Verify local app boot, auth pages, lint, and production build
- [x] Fix the duplicate Supabase migration versions and push the schema cleanly to the new project
- [x] Replace the signed-out app shell with a proper landing page and sign-in gate
- [x] Simplify the signed-in empty workspace so the product no longer opens with a crowded marketing slab

## P0 Launch Blockers

- [ ] Create a brand-new Supabase project for launch
- [ ] Apply all current migrations to the new project with `supabase db push`
- [ ] Reconfigure Supabase Google OAuth with the exact local and production redirect URLs
- [ ] Verify the Gmail connection flow end to end and confirm tokens persist in `gmail_credentials`
- [ ] Run a full happy-path manual test:
  sign up -> first search -> review prospects -> draft emails -> connect Gmail -> send a real email
- [ ] Run a quota and billing test:
  free credits -> exhaustion -> upgrade CTA -> Stripe checkout -> webhook -> post-upgrade credits
- [ ] Add production error monitoring for server routes and client crashes
- [ ] Remove or downgrade noisy debug logging in auth, quota, cache, and prospect routes
- [ ] Confirm all required env vars are present in Vercel production and preview

## P1 Before Public Launch

- [ ] Add 3-5 Playwright smoke tests for auth, prospect search, Gmail connect, and billing
- [ ] Persist campaign/search history where local-only state would create user-visible loss
- [ ] Tighten mobile polish, empty states, loading states, and error states across public pages
- [ ] Add activation analytics for:
  signup, first search, first draft, Gmail connected, first send, upgrade click
- [ ] Add one real enrichment provider behind a flag for higher-confidence person/company data
- [ ] Write an operator runbook for failed search jobs, broken OAuth, and Stripe sync issues

## Product Direction Locked For Launch

- [x] Gmail is the sending backend for launch
- [x] Exa Websets stays the discovery backbone
- [x] Apify is the targeted scraping complement, not the primary enrichment layer
- [x] Apollo is the primary enrichment candidate after discovery
- [x] Hunter remains a verifier/fallback, not the main identity system
- [x] Instantly and AgentMail are post-launch scale layers, not required for weekend launch

## Deferred Until After Launch

- [ ] Add Instantly as a higher-volume campaign backend
- [ ] Add AgentMail for autonomous inboxes and reply loops
- [ ] Build reply classification and follow-up automation
- [ ] Collapse the remaining legacy prospecting surfaces after the core path is stable
