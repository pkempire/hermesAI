# Hermes Product Vision

## Positioning

Hermes is an agentic GTM operator.

It should sit above the modern outbound stack and turn a plain-English brief into a live workflow:

1. Understand the target market, offer, and constraints
2. Decide how to source leads and accounts
3. Enrich identities and contact channels
4. Draft and route outreach
5. Monitor performance and adapt the workflow

## Problem

Outbound today is fragmented and operator-heavy.

Teams juggle:

- Apollo for contacts
- Clay for enrichment logic
- Instantly for sending
- Scrapers and spreadsheets for edge-case sourcing
- Zapier/n8n for brittle glue
- Prompt docs and ad hoc LLM sessions for reasoning

Hermes should remove that orchestration burden.

## Core Promise

Tell Hermes what you want.

Hermes should figure out the workflow.

That means:

- the user should specify outcomes, not low-level tool steps
- the system should remain explainable, inspectable, and editable
- the workflow engine should be structured enough to be reliable
- the agent layer should be flexible enough to adapt when data or tools change

## Product Wedge

The strongest initial wedge is not “AI SDR replacement.”

The strongest wedge is:

`Natural-language workflow control for prospecting, enrichment, and outbound execution.`

For launch, that promise needs to feel concrete:

`Describe your target market and offer. Hermes finds the right people, explains why they fit, drafts outreach, and sends through your Gmail account.`

## Target User

The launch user is not a large RevOps team.

The launch user is:

- a founder doing founder-led sales
- a small agency or recruiting shop
- a lean GTM team that already knows its ICP but hates stitching tools together

These users care more about speed, clarity, and trust than they do about enterprise workflow customization.

## Launch Workflow

The first production workflow should be:

1. User describes target, offer, and constraints
2. Hermes creates a sourcing plan
3. Hermes runs discovery
4. Hermes enriches and scores results
5. Hermes drafts outreach
6. Hermes sends through the user's connected Gmail account or prepares a final review handoff
7. Hermes records the outcome and recommends the next action

## Why This Wins

Hermes should feel meaningfully different from “Apollo plus Clay plus Instantly plus prompts”.

The product advantage is:

- one operator surface instead of tool sprawl
- evidence-backed lead discovery instead of opaque list vending
- natural-language workflow control instead of table engineering
- structured execution underneath, not brittle agent improvisation

## Launch Scope

The launch scope should stay narrow and reliable:

- Google sign-in
- one chat-first command center
- Websets-backed discovery
- light enrichment and evidence display
- Gmail drafting and sending
- basic quotas and paid upgrade path

Everything else is secondary until this path works cleanly end to end.

## Design Principles

- White background, black controls, gold accent
- Messenger / Roman operator mood
- Editorial hierarchy, not generic SaaS gradients
- Show evidence and workflow state, not just forms
- Keep the command center feeling sharp and calm

## Non-Goals

- Recreating Clay tables as the primary UX
- Forcing users to wire Zapier/n8n flows for basic use cases
- Pretending one data source can do discovery, enrichment, and execution equally well
- Hiding all workflow steps behind opaque magic
