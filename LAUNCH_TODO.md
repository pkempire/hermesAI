# Hermes Launch TODO

Source of truth for the current `cleanup/v1-launch-prep` branch.
Mark items done only after verifying them in the running app.

## Just landed (this branch)

- [x] Archive 34 historical doc files into `archive/legacy-docs/`
- [x] Move 13 root junk binaries (PNGs, MP4, .py, .patch) to `archive/legacy-assets/`
- [x] Delete unused video-search components (5 files, Morphic legacy)
- [x] Delete duplicate prospect-search-builder variants (3 files)
- [x] Delete unreferenced `reasoning-section`, `question-confirmation`
- [x] Move 10 dead components (home-command-center, hermes-landing, landing-page,
      pipeline-walkthrough, rotating-text, empty-screen, onboarding-modal,
      ai-copilot-assistant, campaign-analytics-dashboard, campaign-progress-tracker)
      to `archive/legacy-components/`
- [x] Strip `console.*` from production builds via `compiler.removeConsole`
- [x] Pivot brand palette from gold to navy ink + cream + parchment (from design mocks)
- [x] Rebuild landing page: Hero with serif headline + plate illustration,
      Capability menu, Process trio (Brief → Discover → Engage), Proof tiles,
      What you get 4-up, Pricing 3 tiers, ink-cream final CTA
- [x] Minimal white header (Hermes wordmark + outbound operator eyebrow)
- [x] New page metadata: "Hermes — AI Outbound Operator"
- [x] Research doc: `docs/RESEARCH_2026.md` (AI SDK v5, SSE, optimistic UI,
      cmdk, skeletons, memory, MCP — concrete picks with code snippets)
- [x] Production campaign briefs (Lucid Academy x counselors / x directories)
      committed under `docs/campaigns/`
- [x] Open-source-grade README with architecture diagram and setup
- [x] `.gitignore` adds `/archive/` for any future moves

## P0 — must complete before public launch

- [ ] Create new Supabase project (the env-pinned one is dead — DNS doesn't resolve)
- [ ] `supabase db push` all migrations to the new project
- [ ] Configure Google OAuth redirect URLs (local + preview + prod)
- [ ] Verify Gmail connection flow end-to-end and confirm tokens persist in
      `gmail_credentials`
- [ ] Replace 200 ms polling in `prospect-search-section.tsx` with SSE
      (see `docs/RESEARCH_2026.md` §1, §2)
- [ ] Wire Apollo as enrichment fallback when Orangeslice misses
- [ ] Add Sentry server + client error monitoring
- [ ] Decide and lock production domain (currently `hermesai.com` in metadata
      but unowned — pick something we own)
- [ ] Wire pricing page CTAs through Stripe Checkout (links exist, currency live)
- [ ] Run a real happy-path:
      sign up → first search → review prospects → draft emails → connect Gmail → send a real email
- [ ] Run quota + billing test: free credits → exhaustion → upgrade CTA →
      Stripe checkout → webhook → post-upgrade credits
- [ ] Confirm all required env vars are present in Vercel production and preview

## P1 — first 30 days post-launch

- [ ] Split `prospect-search-section.tsx` (898 LOC) into 4 files
      (Builder / Streamer / ResultsTable / EmptyStates)
- [ ] Add `useOptimistic` to prospect mutations + `useTransition` around server
      actions; replace Suspense boundaries on tool cards
- [ ] Add `cmdk`-based command palette (Cmd+K) with quick actions:
      "New campaign", "Find prospects", "Open campaign", "Search history"
- [ ] Add `pgvector` HNSW index on prospect summaries; expose `recall_memory`
      tool on the agent (see `docs/RESEARCH_2026.md` §6)
- [ ] Native AI SDK v5 tool-result rendering (drop manual
      `message-metadata` writing in `create-tool-calling-stream.ts`)
- [ ] 5 Playwright smoke tests for auth, prospect search, Gmail connect, billing, send
- [ ] Persist campaign / search history (some pages currently rely on local state)
- [ ] Activation analytics: signup, first search, first draft, gmail-connected,
      first send, upgrade click
- [ ] Mobile pass on landing + chat (currently desktop-only polish)
- [ ] Operator runbook: failed search jobs, broken OAuth, Stripe drift

## P2 — Hermes MCP server (week 2+)

- [ ] Wrap `prospect_search`, `email_drafter`, `scrape_site` as MCP tools
      using `@modelcontextprotocol/sdk`
- [ ] Ship stdio binary `hermes-mcp` for local Claude Desktop / Cursor / Windsurf
- [ ] Ship Streamable-HTTP server at `/api/mcp` via `@vercel/mcp-adapter`
- [ ] OAuth handoff so MCP calls inherit the user's Hermes plan + quotas
- [ ] Tweet announcement: "Hermes is now an MCP server"

## Decisions locked

- [x] Gmail is the launch sending backend
- [x] Exa Websets is canonical discovery
- [x] Orangeslice is primary enrichment; Apollo + Hunter are fallbacks
- [x] Apify is for niche scraping only, not the primary path
- [x] Instantly + AgentMail are post-launch scale layers
- [x] SaaS first, services agency second (services brand re-used: Hermes GTM)

## Deferred until traction signal

- [ ] Instantly higher-volume sending integration
- [ ] AgentMail autonomous-inbox / reply-loop integration
- [ ] Reply classification + follow-up automation
- [ ] Collapse remaining legacy prospecting surfaces outside the core path
