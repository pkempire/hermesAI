## HermesAI Launch Readiness Plan

This document outlines everything required to take HermesAI from the current state to a production-ready, monetizable SaaS aligned with industry standards. It is structured as: product scope, technical hardening, billing and monetization, security and compliance, operations, testing, and a concrete execution checklist tied to files, env vars, and owners.

### Product scope and value
- **Core value**: AI-powered B2B prospecting and email campaign assistant. Turn natural-language inputs into structured prospect searches using Exa Websets, enrich leads, and generate emails.
- **Primary workflows**:
  - **Chat-driven agent**: Prospect intent → tool calls (prospect_search/search/retrieve) → results + related questions.
  - **Interactive prospect builder**: Extract criteria, preview 1 prospect, then run full search, poll progress, view results.
  - **Email generation**: Create multi-step sequences tailored to prospects.
  - **Campaign persistence** (Supabase): Save campaigns, prospects, and user chat history when enabled.

## Technical hardening and feature completion

### Agent, streaming, and tools
- **Unify AI SDK v5 tool schemas**
  - Standardize all tools to `inputSchema` (currently `prospect_search` uses `parameters`).
  - Files: `lib/tools/prospect-search.ts`, `lib/tools/search.ts`, `lib/tools/retrieve.ts`, `lib/agents/researcher.ts`.

- **Model selection and tool support**
  - Confirm supported providers for GA. Default to OpenAI `gpt-4o`/`gpt-4o-mini`/`gpt-4.1(-mini)` for reliability.
  - Ensure `isToolCallSupported` and `getToolCallModel` behavior match chosen providers.
  - Files: `lib/utils/registry.ts`, `public/config/models.json`.

- **Manual tool mode QA**
  - Validate XML parsing path remains stable with v5 message formats and that it’s only used for models without native tools.
  - Files: `lib/streaming/create-manual-tool-stream.ts`, `lib/streaming/tool-execution.ts`, `lib/streaming/parse-tool-call.ts`.

- **Related questions toggling**
  - Current skip conditions are reasoning models or `ask_question` tool at the end. Validate UX; make it a user setting if needed.
  - Files: `lib/streaming/create-tool-calling-stream.ts`, `lib/streaming/handle-stream-finish.ts`.

### Prospect search (Exa Websets)
- **Canonicalize APIs**
  - Prefer `app/api/prospect-search/execute` + `status` as the canonical flow. Deprecate/remove older `app/api/prospect-search/route.ts`.
  - Ensure interactive UI path consistently calls `execute` with `preview` flag.

- **Preview integration**
  - Wrap preview in the Exa client for consistency (avoid raw fetch in tool). Add basic retries.
  - Files: `lib/clients/exa-websets.ts`, `lib/tools/prospect-search.ts`.

- **Prospect mapping**
  - Confirm enrichment key-mapping with latest Exa schemas; add safe fallbacks. Keep robust handling of array/object shapes.
  - Files: `lib/clients/exa-websets.ts`, `app/api/prospect-search/status/route.ts`.

### Email generation
- **Model updates**
  - Replace legacy `"gpt-4"` with `"gpt-4o"` or `"gpt-4.1(-mini)"` in optimizer and email generator.
  - Files: `lib/clients/openai-query-optimizer.ts`, `app/api/email/generate/route.ts`.

### Persistence and data model
- **Chat history**
  - Decide default: enable or keep optional. Wire to Supabase with RLS policies and retention limits.
  - Files: `lib/streaming/handle-stream-finish.ts`, Supabase migrations and policies.

- **Campaign/prospect schema**
  - Validate tables and indices for campaigns and prospects. Add foreign keys, partitioning or indexes for large datasets.
  - Files: `supabase/migrations/*`, `setup_database.sql`.

## Monetization and billing

### Pricing and packaging
- **Plan design**
  - Free trial (credits), Pro (monthly), Team (seats + usage), Enterprise (annual).
  - Metered components: Exa Websets (search/enrichment volume), LLM tokens.

### Stripe integration
- **Core setup**
  - Products/plans in Stripe; price IDs in env.
  - Checkout + Customer Portal.
  - Webhooks: subscription lifecycle (created, updated, canceled), metered usage reporting.
  - Files: Create `app/api/billing/checkout/route.ts`, `app/api/billing/webhook/route.ts`, `lib/billing/stripe.ts`.

- **Usage metering**
  - Track per-user/org: websets created, items processed, enrichments executed, tokens used.
  - Write daily usage rows; report to Stripe for metered price.
  - Files: `lib/metrics/usage.ts` (new), DB tables + cron.

- **Account limits and paywalls**
  - Enforce plan-based limits (max prospects/day, max searches, max email generations) with graceful errors.
  - Files: `lib/billing/limits.ts` (new), middleware guards in API routes.

## Authentication, authorization, and multi-tenancy

- **Auth**
  - Supabase Auth already in use: verify configured providers (email/password, magic link, OAuth), email templates, rate limits.
  - Files: `lib/supabase/*`, `app/auth/*`.

- **Multi-tenancy**
  - Introduce organizations/workspaces (optional for v1). Associate campaigns/prospects/chats with org IDs.
  - RLS to prevent cross-tenant access.
  - Files: DB migrations for `organizations`, `memberships`, RLS policies.

- **RLS policies**
  - Add row-level security for all user data tables (campaigns, prospects, chats). Ensure only owner/org members can access.
  - Files: `supabase/migrations/*`.

## Security and compliance

- **Secrets and keys**
  - Store `OPENAI_API_KEY`, `EXA_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_*` as server-only env vars.
  - Validate they are never sent to the client. Audit calls that fetch external URLs.

- **HTTP hardening**
  - Set security headers (CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options).
  - CORS locked to app domain for API routes.
  - Files: `middleware.ts`, Next.js config, Vercel headers.

- **Input validation**
  - Use zod schemas for all API inputs; cap lengths; sanitize URLs.
  - Files: each `app/api/*/route.ts`.

- **Abuse safeguards**
  - Rate limiting (per-IP/per-user) on chat and search endpoints.
  - Files: `lib/redis/*`, wrapper middleware for API routes.

- **Data governance**
  - Data retention policy, account deletion, export (CSV for prospects).
  - Legal pages: Terms, Privacy, DPA.
  - Files: marketing site pages.

## Observability and operations

- **Logging and tracing**
  - Structured logs server-side; redact PII in logs.
  - Add Sentry or OpenTelemetry; link request IDs from edge to backend.

- **Metrics**
  - Product metrics: DAU/WAU/MAU, searches started/completed, prospects generated, email templates generated, conversion to subscription.
  - System metrics: error rates, latency, token usage, Exa API quotas.
  - Files: `lib/metrics/*` (new), dashboards.

- **Environments and CI/CD**
  - Dev/Staging/Prod with separate Supabase projects and Exa keys.
  - CI: typecheck, lint, unit/integration tests, preview deploys, migration checks.

- **Backups and DR**
  - Nightly DB backups; migration rollback tested. Export S3 snapshots.

## Testing strategy

- **Unit tests**
  - Tools, schema parsing (XML → tool params), Exa client wrapper, email generation prompts (prompt snapshot tests).

- **Integration tests**
  - Chat API streaming contract (SSE), tool call flow, prospect search execute → status happy path.

- **E2E tests**
  - Auth → start chat → run prospect search preview → run full → see results → generate emails → billing flow.
  - Headless browser in CI (Playwright).

- **Load and resilience**
  - Burst tests on `/api/chat` and `/api/prospect-search/status` polling. Backoff + jitter in polling.

- **Security testing**
  - SSRF via `retrieve` tool URLs, CSP coverage, authz bypass attempts, rate limit evasion.

## Landing page and GTM

- **Marketing site**
  - Hero, social proof, feature walkthroughs, demo video, pricing, FAQ, contact.
  - Trust pages: Terms, Privacy, DPA, Subprocessors, Status page.
  - SEO: metadata, OpenGraph, sitemap, robots.

- **Onboarding**
  - Guided onboarding (sample prompts), default campaign templates, checklists in-app.

- **Analytics**
  - Vercel Analytics + product analytics (PostHog/Amplitude). Funnel for trial → paid → activated.

- **Support**
  - In-app help, knowledge base, email support, issue reporting.

## Concrete execution checklist

### Required env vars
- **Core**: `OPENAI_API_KEY`, `EXA_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server), `NEXT_PUBLIC_APP_URL`.
- **Search providers**: `SEARCH_API` in {`tavily`,`exa`,`searxng`}; for SearXNG: `SEARXNG_API_URL`.
- **Billing**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### Code tasks (high priority)
- [ ] Standardize tool schemas to `inputSchema` in `lib/tools/prospect-search.ts`.
- [ ] Update OpenAI model names in `lib/clients/openai-query-optimizer.ts` and `app/api/email/generate/route.ts`.
- [ ] Remove/deprecate `app/api/prospect-search/route.ts` in favor of `execute`/`status`.
- [ ] Wrap Exa preview in `lib/clients/exa-websets.ts` and use from tool.
- [ ] Add API input validation (zod) for all POST routes.
- [ ] Implement rate limiting middleware for `/api/chat`, `/api/prospect-search/*`.
- [ ] Decide and enable chat persistence (`ENABLE_SAVE_CHAT_HISTORY=true`) and ensure Supabase tables + RLS.

### Billing tasks
- [ ] Create Stripe products/prices; add price IDs to config.
- [ ] Implement checkout and portal routes; secure webhooks.
- [ ] Implement usage metering (DB + Stripe usage API) for Exa/LLM.
- [ ] Add plan-based limit checks in API routes.

### Auth and multi-tenancy
- [ ] Confirm Supabase Auth flows; enable chosen OAuth providers.
- [ ] Add organizations (optional v1) and RLS policies; migrate data model.
- [ ] Add account deletion/export endpoints.

### Security
- [ ] Add CSP and security headers in `middleware.ts`/Next config.
- [ ] Sanitize and validate external URLs (retrieve tool); denylist protocols.
- [ ] Ensure secrets never leak to client (audit fetches/props).

### Observability
- [ ] Add Sentry/OpenTelemetry; structured server logs.
- [ ] Add product/system metrics collection.

### Testing
- [ ] Unit tests for tools, parsers, Exa client.
- [ ] Integration tests for streaming and prospect flow.
- [ ] E2E for signup → chat → search → email → checkout.
- [ ] Load tests for chat/status endpoints.

### Landing/GTM
- [ ] Build landing/pricing pages; add Terms/Privacy/DPA.
- [ ] Add analytics + events; set up support channel.

## Launch criteria (go/no-go)
- **Functional**: All core flows work reliably (native and manual tools), preview and full prospect searches produce usable results, email generation consistent.
- **Quality**: >99% success across test scenarios; no P0/P1 bugs open; observability in place.
- **Security**: Headers, rate limits, RLS policies, secrets management verified.
- **Billing**: End-to-end subscription and metering tested in Stripe test mode; plan limits enforced.
- **Docs**: README, configuration docs, onboarding and policies live.

---
Owner roles and timeline can be appended here. Recommend a two-week hardening sprint followed by a staged rollout (private beta → public beta → GA).


