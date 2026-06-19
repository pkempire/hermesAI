# Hermes Backend API Audit

Last updated: 2026-06-08

## Stack Answer

Hermes is not using FastAPI. The backend is a Next.js App Router backend in TypeScript, deployed as Vercel route handlers under `app/api/**`.

The core agent stack is:

- `app/api/chat/route.ts`: authenticated chat entrypoint, rate limited, default model `openai:gpt-5-mini`, streams through Vercel AI SDK.
- `lib/streaming/create-tool-calling-stream.ts`: converts UI messages to model messages, calls `streamText`, and streams tool parts/UI pipeline events.
- `lib/agents/researcher.ts`: builds the Hermes tool surface: search, ask_question, prospect_search, scrape_site, email_drafter, memory.
- `lib/tools/prospect-search.ts`: interactive builder mode or deterministic headless Websets execution.
- `app/api/prospect-search/execute/route.ts`: creates/reuses Exa Websets, persists campaign ownership, returns stream config.
- `app/api/prospect-search/stream/route.ts`: SSE polling loop for Exa Websets, converts items to prospects, currently enriches with Orangeslice while streaming.
- `app/api/enrich/people/route.ts`: on-demand selected-company contact enrichment.
- `app/api/mcp/route.ts` and `bin/hermes-mcp`: Streamable HTTP and stdio MCP surfaces for external agents.

Current agent-infra status:

- The app is on AI SDK v6-era packages.
- The main native-tool chat path now runs through `ToolLoopAgent.stream()`,
  while preserving Hermes custom pipeline events and chat persistence.
- Incoming UI messages are checked with `safeValidateUIMessages` before falling
  back to the legacy sanitizer for old saved chats.
- The deprecated manual tool-call backend path and unused legacy model catalog
  have been removed from the launch path; Hermes now requires native
  tool-capable models.
- It is not yet using `createAgentUIStreamResponse`; the current wrapper still
  needs a writer so Hermes can emit `data-pipeline` progress and save chat
  history from `handleStreamFinish`.
- It is not yet using Vercel Workflow/durable execution for long-running runs.
- That is acceptable for a launch demo if the app is honest about reviewable
  discovery/drafting. It is not enough for high-volume autonomous GTM execution.
- The next architecture step is intent parser -> deterministic workflow executor
  -> event log/UI stream -> agentic recovery, not exposing every vendor connector
  directly to the chat model.

## Customer-Facing Routes

- `GET /api/auth/me`: current authenticated user.
- `POST /api/chat`: main natural-language Hermes agent.
- `GET /api/chats`, `GET/DELETE /api/chat/:id`: chat history.
- `POST /api/prospect-search/execute`: start an Exa Websets search.
- `GET /api/prospect-search/stream`: stream Websets progress and prospect results.
- `POST /api/enrich/people`: resolve decision makers, email, phone, LinkedIn, and Hermes take for selected prospects.
- `POST /api/email/generate`, `POST /api/email/draft`, `POST /api/email/create-draft`: email generation/drafting surfaces.
- `POST /api/gmail/draft`, `POST /api/gmail/send`: Gmail-connected draft/send actions.
- `GET/POST /api/campaigns`, `GET/POST /api/campaigns/:id/prospects`, `GET/POST /api/campaigns/:id/sequence`: campaign storage.
- `GET /api/templates`, `POST /api/templates/save`, `POST /api/templates/use`: template marketplace/storage.
- `POST /api/stripe/create-checkout`, `POST /api/stripe/webhook`, `GET /api/subscription`: billing/subscription.
- `POST /api/mcp`: MCP Streamable HTTP endpoint.
- `GET /api/health`: health check.

Deprecated route handlers:

- `POST /api/prospect-search`: returns 410; use execute + stream.
- `GET /api/prospect-search/status`: deprecated; use execute + stream.

## Prospect Flow

1. User sends a natural-language brief to `/api/chat`.
2. The model calls `scrape_site` if the offer needs context, then `prospect_search`.
3. `prospect_search` returns either an in-app builder config or a deterministic Webset start payload.
4. `POST /api/prospect-search/execute` creates or reuses an Exa Webset and persists a Supabase campaign row for ownership.
5. `GET /api/prospect-search/stream` polls Exa every 1.5 seconds, lists Webset items, converts them to `Prospect`, streams raw companies immediately, starts lightweight Orangeslice company enrichment, and emits SSE progress/complete events.
6. The prospect grid renders companies first. The user selects rows and clicks Find Contacts.
7. `POST /api/enrich/people` runs the deeper person/contact/Hermes-take waterfall in batches of 6.
8. The grid merges returned prospects and sends selected prospects into Draft Studio.

## Exa Websets Notes

The current Exa docs show the simple happy path:

- `exa.websets.create({ search, enrichments })`
- `exa.websets.waitUntilIdle(webset.id, { timeout, pollInterval, onPoll })`
- `exa.websets.items.list(webset.id, { limit })`

Hermes wraps this because the product needs a live UI, auth, campaign ownership, and partial results. That wrapper should stay thin.

What is now aligned:

- Search creation uses the official SDK shape.
- Item listing uses `exa.websets.items.list`.
- Discovery no longer blocks on full person/contact enrichment.
- The stream now emits raw Exa items quickly, then updates rows as company enrichment completes.

What should change before high-volume production:

- Exa events/webhooks update durable workflow state.
- Store Exa `dashboardUrl`, progress, external ids, and event ids on the campaign/workflow record.
- Browser streams should read durable state and fail loudly when webhook events are missing.

## Contact Enrichment Fix

The stuck/confusing UI came from field-shape drift:

- The enrichment route returns canonical `email`, `fullName`, `jobTitle`, `linkedinUrl`, and `phone`.
- The client success count still checked stale aliases like `contactEmail` and `contactName`.
- The collapsed table row hid the actual email behind a generic "Email found" badge.

Patched:

- Added `components/prospect-search/contact-enrichment.ts` to normalize `email/fullName` aliases in one place.
- Updated both streaming and completed-result grids to use the shared helper.
- Updated `/api/enrich/people` found-count logic to use canonical fields.
- Updated the prospect grid to show actual email addresses, selected-row loading states, and prevent double-click enrichment.

## Performance Notes

Keep the TypeScript/Vercel backend for now. The slow path is not language runtime overhead; it is external IO:

- Exa Websets creation/progress polling.
- Orangeslice company/person/contact lookups.
- Optional Apollo/Hunter secondary provider calls when explicitly enabled.
- Per-prospect Hermes take generation.

The 2026-06-08 patch separated these phases:

- Discovery stream: Exa item discovery + lightweight company enrichment.
- Find Contacts: Orangeslice person lookup + contact lookup + optional secondary enrichment + Hermes take.

Recommended launch architecture:

- Keep `POST /api/chat` streaming and short.
- Keep Exa Websets as the discovery engine because the UI can stream partial results.
- Move deeper enrichment and Hermes take generation into durable background work before scaling beyond demos.
- Persist step state per campaign/prospect, including source, status, latency, error, and last normalized payload.
- Add per-provider timeouts and partial-result semantics as first-class UI state.
- Use MCP HTTP transport for production connectors; keep stdio only for local desktop agent workflows.

## Near-Term Launch Blockers

- Configure `EXA_WEBHOOK_SECRET` and the Exa Websets webhook for production.
- Confirm production env has `EXA_API_KEY`, `ORANGESLICE_API_KEY`, Supabase vars, OpenAI/Anthropic vars, Stripe/Gmail vars, and Redis vars.
- Test one full campaign on production after deploy: scrape site, configure search, stream prospects, find contacts, save to Draft Studio, draft email.
- Leave Apollo/Hunter disabled unless keys, quotas, and UI disclosure are explicit.
- Add durable queue/workflow before promising high-volume autonomous execution.
