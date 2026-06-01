# Hermes Demo Checklist

## Before Recording

- Confirm `.env.local` has Supabase, OpenAI, Exa, Orangeslice, Google OAuth,
  and Stripe keys.
- Optional but recommended: add `APOLLO_API_KEY` and `HUNTER_API_KEY` for
  stronger contact enrichment.
- Confirm `STRIPE_PRICE_ID` is set before showing checkout.
- Run `npm run lint`.
- Run `npm run build`.
- Start `npm run dev`.
- Open `http://localhost:3000`.

## Demo Account Prep

- Sign in with Google so Gmail draft scopes are granted.
- Run one small preview search first to avoid waiting on camera.
- Keep one completed campaign available in Recent.
- Keep one prospect card expanded with evidence visible.
- Have one email draft ready to create in Gmail.

## Shot List

1. Landing hero and product prompt preview.
2. Sign-in gate preserving the landing prompt.
3. Workspace prompt with Guided/Direct mode.
4. Prospect builder with preview mode.
5. Streaming prospect viewer.
6. Expanded prospect card with LinkedIn, phone/email fields, evidence, and
   Hermes take.
7. Email drafter and "Create Gmail Draft".
8. MCP deterministic prospect search example in `docs/MCP.md`.
9. Pricing page showing free trial, Operator, and Premium roadmap.

## Launch-Blocking Checks

- Unauthenticated `/api/chat` returns 401.
- Unauthenticated `/api/prospect-search/execute` returns 401.
- `/api/health` returns 200 in the target environment, or the failing service
  is intentionally disabled for launch.
- Gmail OAuth callback writes tokens to the signed-in user, not a placeholder
  account.
- Stripe checkout starts for a signed-in user with no card required on first
  trial.
- MCP HTTP rejects unauthenticated POSTs and accepts calls with either session
  cookie or `x-hermes-user-id`.

## Messaging Guardrails

- Say "review-first" and "Gmail drafts", not "fully autonomous sending".
- Say "source-backed enrichment" instead of "perfect data".
- Say "helps compress research and drafting" instead of "replaces sales".
- Present LinkedIn sending, network search, and phone enrichment as roadmap or
  optional enrichment, not launch-critical promises.
