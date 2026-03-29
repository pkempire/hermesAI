# Hermes System Architecture

## Runtime Shape

Hermes is a Next.js App Router application with a chat-first operator workflow.

### Core layers

1. Presentation layer
   - public landing page
   - authenticated workspace
   - campaigns and exports

2. Agent orchestration layer
   - chat endpoint
   - tool-calling stream
   - structured workflow progression

3. Data and auth layer
   - Supabase auth
   - Supabase relational storage
   - Gmail credential persistence
   - subscription and usage tracking

4. External intelligence layer
   - Exa Websets for discovery
   - orangeslice services for research/search
   - Apollo as next enrichment layer
   - Hunter as verification fallback

5. Execution layer
   - Gmail for launch sending
   - Stripe for billing

## Current Canonical Flow

1. User signs in with Google
2. User submits a campaign brief
3. Hermes runs discovery and streams progress
4. Prospects are normalized and displayed
5. Hermes drafts outreach
6. User connects Gmail
7. Hermes sends or prepares drafts

## Main Repo Components

### Frontend

- `app/page.tsx`
- `components/landing-page.tsx`
- `components/chat.tsx`
- `components/chat-panel.tsx`
- `components/home-command-center.tsx`

### Auth and session

- `app/auth/oauth/route.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `app/api/auth/me/route.ts`

### Prospecting and orchestration

- `app/api/chat/route.ts`
- `app/api/prospect-search/stream/route.ts`
- `lib/agents/researcher.ts`
- `lib/clients/exa-websets.ts`

### Sending and billing

- `lib/clients/gmail.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/utils/quota.ts`

## Tooling Decisions

### Keep

- Next.js
- Supabase
- Exa Websets
- orangeslice
- Gmail launch path

### Add next

- Apollo enrichment
- Sentry
- Playwright smoke tests

### Defer

- Instantly
- AgentMail
- MCP-dependent runtime behavior

## Open Risks

- Gmail and Google OAuth setup drift across local, preview, and production
- limited automated test coverage
- enrichment still weaker than the final product vision
- remaining legacy UI and workflow surfaces outside the main path
