# Hermes GTM Operator Playbook

## What To Demo

Optimize the demo around one moment: a user gets from a messy GTM idea to one
reviewed email draft they would actually send.

Avoid generic database prompts. Hermes is most compelling when the audience can
feel the combination logic:
- fresh web discovery
- specific buying signal
- persona resolution
- source-backed personalization
- Gmail draft review
- deterministic MCP execution for repeatable runs

## Strong Demo Prompts

### Local Services Expansion

```text
Find 40 multi-location dental clinics in Phoenix with outdated websites or weak
online booking. I sell website conversion and appointment-booking improvements.
Reach the owner, operations leader, or marketing manager and draft one
evidence-backed email.
```

Why it works: broad TAM, obvious buyer, easy evidence, and a concrete service
offer.

### Hiring Signal Outbound

```text
Find 35 B2B software companies hiring customer success managers and
implementation specialists. I sell onboarding automation software. Reach the VP
Customer Success, Head of Implementation, or COO and draft a concise email tied
to the hiring signal.
```

Why it works: hiring is a clean buying signal and works across big markets.

### Review Pain Conquest

```text
Find 30 home service companies in Texas with recent reviews mentioning
scheduling delays, missed appointments, or slow follow-up. I sell call answering
and booking automation. Reach the owner or operations manager and draft one
respectful, evidence-backed email.
```

Why it works: pain is public, specific, and easy to personalize without sounding
generic.

### Partnership Motion

```text
Find 25 companies with public integrations or partner marketplaces that serve
accounting firms. I sell workflow automation for accounting practices. Reach the
partnerships, ecosystem, or alliances owner and draft a partner intro email.
```

Why it works: it broadens Hermes beyond cold outbound into channel and ecosystem
work.

### Event Sponsor Follow-Up

```text
Find 30 companies sponsoring supply chain or manufacturing conferences in the US
this quarter. I sell field marketing content production. Reach the VP Marketing,
events lead, or demand gen leader and draft a post-event campaign pitch.
```

Why it works: event pages are structured public sources and a strong timing
signal.

## Social Signal Roadmap

Apify-style social actors are useful for demos when used as public-signal
inputs, especially for conference lists, X posts, LinkedIn company pages, and
public people profiles. For launch, treat this as an optional connector behind
a feature flag:

- `SOCIAL_SIGNALS=off|apify`
- no auto-send from scraped social data
- store source URLs and timestamps
- show confidence labels
- keep LinkedIn messaging as roadmap unless OAuth/API/legal review is complete

The launch version can still say: "Hermes can use live web signals today; social
and LinkedIn-native actions are premium roadmap."

## Marketplace Template Ideas

- "Local services expansion"
- "Hiring signal outbound"
- "Review pain conquest"
- "Partner marketplace finder"
- "Funding and expansion"
- "Event sponsor follow-up"
- "Ecommerce growth sweep"
- "Recruiting target map"

Each template should have:
- example prompt
- required inputs
- suggested enrichments
- one-result preview
- deterministic MCP JSON payload
- sample email output

## Conversion Goal

The product should bias every new user toward sending one high-quality email:

1. Pick a template or paste a messy idea.
2. Preview one account.
3. Approve a 10-25 account run.
4. Expand one prospect card.
5. Draft one email from evidence.
6. Create one Gmail draft.

That is the "aha". Everything else should support getting there cleanly.
