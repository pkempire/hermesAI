# Hermes Launch Checklist

Source of truth for `cleanup/v1-launch-prep`.

## Current branch status

- [x] Signed-in workspace uses the navy/ink product UI.
- [x] Prospect discovery streams from durable campaign run state.
- [x] Exa webhook route exists at `/api/webhooks/exa`.
- [x] Supabase workflow migration `20260615090000_campaign_workflow_state.sql` is applied to the remote Hermes project.
- [x] Preview deployment and GitHub CI passed for PR #8.

## Production launch blockers

- [ ] Set `EXA_WEBHOOK_SECRET` in Vercel production and preview.
- [ ] Create or update the Exa Websets webhook:
  `https://gethermes.vercel.app/api/webhooks/exa`
- [ ] Subscribe the Exa webhook to:
  `webset.search.updated`, `webset.search.completed`, `webset.item.created`,
  `webset.item.enriched`, and `webset.idle`.
- [ ] Confirm Vercel production has `EXA_API_KEY`, `ORANGESLICE_API_KEY`,
  `OPENAI_API_KEY`, Supabase vars, Google OAuth vars, Stripe vars, and Redis vars.
- [ ] Confirm Google OAuth redirect URLs include local, preview, and production.
- [ ] Merge PR #8 into `main` and let Vercel production deploy.
- [ ] Run one real happy path on production:
  sign in, submit a brief, stream prospects, resolve contacts, save to Studio,
  generate a draft, and create a Gmail draft.

## First revenue polish

- [ ] Add Sentry or Vercel Observability alerts for failed webhook, Exa, Orangeslice,
  Gmail, and Stripe calls.
- [ ] Add activation analytics for signup, first search, first contact found,
  first draft, Gmail connected, and upgrade click.
- [ ] Add Playwright smoke tests for auth, prospect search, contact resolution,
  draft generation, Gmail connect, and billing.
- [ ] Decide whether Apollo, Hunter, or Apify are enabled per workspace; do not run
  them silently.

## Deferred

- [ ] Higher-volume sending through Instantly or AgentMail.
- [ ] Reply classification and follow-up automation.
- [ ] Team workflows and shared campaign memory.
