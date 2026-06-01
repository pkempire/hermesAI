# Hermes — AI Outbound Operator

> Describe your ICP in one line. Hermes finds the right companies, resolves the
> decision-maker, drafts pitches grounded in real evidence, and sends through
> your Gmail. One operator instead of Apollo + Clay + Instantly + glue.

Hermes is an open-source, chat-first agent for B2B outbound. Tell it what you
want; it runs the workflow. Built on Next.js 15, the Vercel AI SDK v5, Exa
Websets for discovery, Orangeslice for enrichment, and Gmail for sending.

```
You: Find 25 Bay Area private college counselors who specialize in STEM/Ivy
     applications. I want to refer their students to my AI/research program
     for high schoolers (lucid-education.com).

Hermes:
  → reads lucid-education.com to understand the offer
  → builds a Webset on Exa (boutique counseling firms, founder-led, Bay Area,
    STEM/Ivy specialty)
  → resolves the founder + verified email per firm via Orangeslice
  → enriches with: firm size, outcomes posted, service area, STEM evidence
  → drafts a personal pitch per prospect that cites real evidence
  → opens a Gmail draft you approve, then sends
```

[Live demo](https://hermes-app.vercel.app) · [Architecture](./docs/SYSTEM_ARCHITECTURE.md) ·
[Research log](./docs/RESEARCH_2026.md) · [Discord](https://discord.gg/hermes)

---

## Table of contents

- [What it does](#what-it-does)
- [Repo layout](#repo-layout)
- [Local development](#local-development)
- [Required services](#required-services)
- [Architecture](#architecture)
- [Engineering principles](#engineering-principles)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

| Capability | Powered by | File |
|---|---|---|
| Semantic discovery (companies + people) | Exa Websets | `lib/clients/exa-websets.ts` |
| Decision-maker resolution + verified email | Orangeslice | `lib/clients/orangeslice.ts` |
| Site analysis (your offer / their offer) | Exa getContents | `lib/tools/scrape.ts` |
| Web research per prospect | Tavily / SearXNG / Exa | `lib/tools/search/providers/` |
| Personalised email drafts grounded in evidence | OpenAI / Anthropic via AI SDK v5 | `lib/tools/email-drafter.ts` |
| Gmail draft + send (with refresh token rotation) | Google APIs | `lib/clients/gmail.ts` |
| Quotas + billing | Stripe + Supabase | `lib/utils/quota.ts`, `app/api/stripe/` |

Optional fallbacks: Apollo, Hunter (`lib/clients/`).

## Repo layout

```
hermesAI/
├── app/                    # Next.js 15 App Router
│   ├── api/                # Route handlers (chat, prospect search, gmail, stripe, ...)
│   ├── auth/               # Sign-in / sign-up / OAuth callbacks
│   ├── search/             # Per-search detail page
│   ├── share/              # Public share view
│   └── layout.tsx          # Root layout, fonts, metadata
├── components/
│   ├── marketing/          # Landing-page sections (hero, below-fold)
│   ├── artifact/           # Inline tool-result panels (search, retrieve, ...)
│   ├── inspector/          # Side-panel inspector
│   ├── sidebar/            # Chat history sidebar
│   ├── ui/                 # shadcn primitives
│   ├── chat.tsx            # useChat root, stream lifecycle
│   ├── chat-panel.tsx      # Empty-state hero + chat input
│   ├── prospect-*.tsx      # Prospect builder, table, grid, preview cards
│   └── interactive-email-drafter.tsx
├── lib/
│   ├── agents/             # System prompts + tool wiring (researcher, manual-researcher)
│   ├── tools/              # Tool definitions (prospect_search, email_drafter, scrape, search, retrieve, question)
│   ├── clients/            # External-service clients
│   ├── streaming/          # AI SDK stream + manual stream + tool-result handling
│   ├── auth/               # Supabase auth helpers
│   ├── supabase/           # Browser + server Supabase clients
│   ├── redis/              # Upstash + local Redis config
│   └── utils/              # Quota, rate-limit, registry, logger
├── supabase/migrations/    # Postgres schema (campaigns, prospects, draft_emails, gmail_credentials, subscriptions, ...)
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── PRODUCT_VISION.md
│   ├── INTEGRATION_STRATEGY.md
│   ├── PRODUCT_SPEC.md
│   ├── PROSPECT_SEARCH_ARCHITECTURE.md
│   ├── RESEARCH_2026.md          # 2026 best-practices reference
│   ├── DEPLOYMENT_SETUP.md
│   ├── DB_RECOVERY_PLAN.md
│   ├── USE_CASE_TEMPLATES.md
│   ├── design/                   # Design mocks
│   └── campaigns/                # Real production campaign briefs (JSON)
└── archive/                # Legacy + deprecated code, gitignored for new contributions
```

## Local development

Prerequisites:

- Node.js >= 20 (Next.js 15 requires it)
- npm 10+ (the checked-in lockfile is `package-lock.json`)
- [Bun](https://bun.sh) 1.2+ only if you run the local stdio MCP server
- A Supabase project (auth + Postgres)
- An Upstash Redis instance (or local Redis on `:6379`)
- API keys for at least: OpenAI, Exa, and one of Tavily/SearXNG

Quick start:

```bash
git clone https://github.com/pkempire/hermesAI.git
cd hermesAI

# 1. Configure
cp .env.example .env.local
$EDITOR .env.local                     # fill in keys (see comments)

# 2. Install
npm install

# 3. Migrate
npx supabase db push                   # applies supabase/migrations/

# 4. Run
npm run dev                            # http://localhost:3000
```

Common pitfall: running Next against Node 18 fails. Use `nvm use 20` (or
`fnm use 20`) before running. The package's `engines` block requires Node 20+.

## Required services

| Service | Purpose | Free tier? |
|---|---|---|
| OpenAI / Anthropic | LLM calls | API key |
| Exa | Webset discovery + content scrape | Free monthly credits |
| Orangeslice | Person/company enrichment + verified contact | Paid (contact for keys) |
| Supabase | Auth, Postgres, Storage | Generous free tier |
| Upstash Redis | Cache, rate-limit, resumable stream store | Free tier |
| Stripe | Billing | Test mode is free |
| Google OAuth + Gmail API | User sign-in + outbound sending | Free |

Optional: Tavily (web search), SearXNG (self-hosted search), Apollo, Hunter.

See `.env.example` for the full list and inline notes per variable.

## Architecture

```
                       ┌────────────────────────────────────┐
                       │            Browser                 │
                       │  Next.js 15 App Router             │
                       │  React 19 + AI SDK v5 useChat      │
                       └───────────────┬────────────────────┘
                                       │  SSE (text/event-stream)
                                       ▼
            ┌──────────────────────────────────────────┐
            │  /api/chat  (Edge or Node runtime)       │
            │  ─ verifies user, rate-limit, model      │
            │  ─ streamText({ tools, smoothStream })   │
            └─────────────┬───────────────┬────────────┘
                          │               │
                          ▼               ▼
              ┌─────────────────┐ ┌──────────────────┐
              │  Tool registry  │ │  Memory (Redis + │
              │  prospect_search│ │  Postgres)       │
              │  email_drafter  │ └──────────────────┘
              │  scrape_site    │
              │  search,retrieve│
              │  ask_question   │
              └────────┬────────┘
                       │
        ┌──────────────┼─────────────────┐
        ▼              ▼                 ▼
   ┌────────┐    ┌─────────────┐   ┌─────────────┐
   │  Exa   │    │ Orangeslice │   │   Gmail     │
   │Websets │    │ enrichment  │   │  drafts +   │
   └────────┘    └─────────────┘   │   send      │
                                   └─────────────┘
```

Detailed: [docs/SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md).

## Engineering principles

1. **Tools, not flows.** Every workflow primitive is a single `tool({…})`
   definition. The agent decides composition. No orchestration DAGs.
2. **Streaming is non-negotiable.** Every long-running operation (Webset
   creation, enrichment, drafting) streams via SSE through the AI SDK; no UI
   polling.
3. **Evidence first.** No tool returns generic data. Every prospect gets
   citation-grade extractions; every email cites them.
4. **Owner data.** Users must be able to export prospects, drafts, and
   campaign histories at any time, in JSON or CSV.
5. **No vendor lock-in in the UI.** Customers don't need to know we use Exa or
   Orangeslice. They see Hermes.

## Contributing

We accept PRs. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[code of conduct](./CODE_OF_CONDUCT.md).

Style:

- TypeScript strict, no `any` outside compatibility shims.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- New features must include a brief in `docs/` and a happy-path test.
- New tools must be defined in `lib/tools/`, registered in
  `lib/agents/researcher.ts`, and surfaced in `components/tool-section.tsx`.

## License

Apache 2.0 — see [LICENSE](./LICENSE).
