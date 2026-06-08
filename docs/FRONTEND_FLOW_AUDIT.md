# Hermes Frontend Flow Audit

Last updated: 2026-06-07

## Design Source Of Truth

- `docs/design/landing-mock-1.png`, `landing-mock-2.png`, and `landing-mock-3.png` are the strongest visual direction: editorial serif headings, navy ink, blue accents, hairline cards, system diagrams, and restrained product density.
- Commit `6b7535b` had the mock-derived marketing implementation in `components/marketing/hero.tsx` and `components/marketing/below-fold.tsx`. Those files no longer exist in the live tree, but their direction has been pulled back into `components/landing.tsx`.
- Archive-only legacy surfaces live under `archive/legacy-components/*`. They should not be imported into production without rewriting copy and interaction contracts.

## Live Route Map

| Route | Customer Surface | Primary Component | Notes |
| --- | --- | --- | --- |
| `/` signed out | Product landing | `app/page.tsx` -> `components/landing.tsx` | Uses the mock-derived editorial product landing and embedded prompt preview. |
| `/` signed in | Main workspace | `app/page.tsx` -> `HermesAppLoader` -> `HermesApp` -> `Chat` | Primary app surface. Empty state is `WorkspaceHome`; composer is `ChatPanel`. |
| `/search` | Search workspace route | `app/search/page.tsx` | Auth-gated workspace path. |
| `/search/[id]` | Saved/reopened chat | `app/search/[id]/page.tsx` | Loads saved messages into `Chat`. |
| `/campaigns` | Campaign list | `app/campaigns/page.tsx` | Shows saved campaign records and status. |
| `/studio` | Draft studio | `app/studio/page.tsx` | Uses prospects saved from `ProspectGrid`. |
| `/pricing` | Upgrade/trial page | `app/pricing/page.tsx` -> `PricingPage` | Stripe checkout entry. |
| `/auth/*` | Auth | `login`, `sign-up`, `forgot-password`, `update-password` | Supabase auth surfaces. |
| `/share/[id]` | Shared result | `app/share/[id]/page.tsx` | Public/readonly result surface. |

## Primary User Flows

### Signed-Out To First Prompt

1. User lands on `/`.
2. `Header` renders landing nav and Start Free CTA.
3. `LandingPage` presents product story and `LandingChatPreview`.
4. User edits preview prompt and clicks `Sign in to run`.
5. `LandingChatPreview` stores `hermes_draft` in `localStorage`.
6. User is sent to `/auth/sign-up`.
7. After auth, `Chat` restores `hermes_draft` into the composer.

### Signed-In New Campaign

1. `app/page.tsx` detects Supabase user and renders `HermesAppLoader`.
2. `HermesApp` creates a chat id and renders `Chat`.
3. With zero messages, `ChatPanel` renders `WorkspaceHome` and `TemplateMarketplace`.
4. User can type, choose a starter, load a template, run direct, attach CSV/text, or use voice input.
5. `ChatPanel.submitCurrentMessage` confirms auth through `/api/auth/me`.
6. `Chat.onSubmit` calls `sendMessage` through `DefaultChatTransport` to `/api/chat`.
7. The model streams text/tool parts back to `ChatMessages`.

### Prospect Discovery

1. `/api/chat` calls the `prospect_search` tool.
2. `RenderMessage` normalizes AI SDK tool parts and sends them to `ToolSection`.
3. `ToolSection` routes `prospect_search` into `ProspectSearchSection`.
4. `ProspectSearchSection` parses args/result and chooses one UI state:
   - `interactive`: render `ProspectSearchBuilder`
   - `streaming`: render `ProspectSearchStreamer`
   - `results`: render `ProspectSearchResults`
   - `error`: render retry/error state
5. Builder actions call `/api/prospect-search/execute`.
6. Streaming state subscribes through `useProspectStream` to `/api/prospect-search/stream`.
7. Streamed prospects render in `ProspectGrid`.
8. User selects companies and clicks `Find Contacts`.
9. Contact enrichment calls `/api/enrich/people`.
10. User clicks `Save` or `Save to Studio`, which writes to `campaignStore` for `/studio`.

### Website Reading

1. `/api/chat` calls `scrape_site`.
2. `ToolSection` renders the offer snapshot card.
3. On successful result, `ToolSection` writes `businessName`, `offer`, and `motionIcp` into `campaignStore`.
4. That context can feed later prospect and email-drafting steps.

### Email Drafting

1. `/api/chat` calls `email_drafter`.
2. `ToolSection` dynamically renders `InteractiveEmailDrafter`.
3. If prospects are not passed in tool props, it hydrates from `sessionStorage.hermes-latest-prospects`.
4. Draft creation and Gmail actions route through email/Gmail API endpoints.

## Current Frontend Slop / Duplication

- Landing variants exist in three places: current `components/landing.tsx`, archived legacy components, and git-history-only `components/marketing/*`. Current live code should be the only import path.
- Prospect search is correctly split under `components/prospect-search/*`, but older siblings still exist: `components/prospect-table.tsx`, `components/prospect-card.tsx`, and `components/prospect-preview-card.tsx`. Keep until each route is verified, then delete or consolidate.
- `EnhancedProspectSearchBuilder` is still a large legacy-style builder with different visual language than the updated Prospect Discovery surface.
- `ToolSection` is doing rendering, sessionStorage fallback, and campaign store mutation. It works, but it is a high-risk boundary and should eventually be split by tool renderer.
- `Chat` contains duplicated layout branches for progress/no-progress states. The behavior is useful, but styling should keep sharing primitives to avoid drift.
- `components/ui/card.tsx` still has legacy rounded/shadow defaults. Many live components override it, but any new `Card` can inherit the older soft/rounded look unexpectedly.

## Recent UX Fixes In This Pass

- Signed-in header no longer shows landing anchors: `Product`, `Workflow`, `Preview`, `Pricing`, `Start`.
- Signed-in empty state now has interactive prompt starters wired into the composer.
- Composer has tighter borders, stable controls, and `Review` / `Direct` mode labels.
- Prospect Discovery card now uses the mock-derived ink/blue palette, tighter sizing, lower-radius borders, and live stage telemetry.
- Prospect rows now use consistent blue accents, clearer selection, and cleaner contact actions.
