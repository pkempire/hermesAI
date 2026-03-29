# Integration Strategy

This document captures the recommended external stack for Hermes.

## Selection Criteria

For each integration, optimize for:

- cheapest practical path to launch
- primitive building blocks instead of heavyweight lock-in
- unique or hard-to-source data
- clear API ergonomics
- ability to keep Hermes as the operator layer

## Recommended Stack

### Discovery backbone

- Exa Websets
- Apify
- orangeslice web/search services

#### Why

Exa Websets remains the best backbone for scalable structured web discovery in the current product. It is already integrated and gives Hermes a fast way to turn natural-language sourcing instructions into working search jobs.

Apify is the right complement, not a replacement. Use it for:

- niche directories
- repeated scraping targets
- websites or platforms where Websets lacks coverage
- social or marketplace surfaces that need actor-based extraction

Hermes should route to Apify when a source needs targeted scraping, repeatable extraction, or unique marketplace/directory coverage. That gives Hermes access to unique data without forcing every query through a scraper-first path.

### Identity and contact enrichment

- Apollo
- Hunter

#### Why

Apollo should be the primary person/company enrichment layer.
Hunter should stay focused on email verification and domain-level confidence, not broad discovery.

Clay is an excellent benchmark for orchestration patterns, but it should not be a hard dependency for the core runtime. Hermes should internalize the best Clay ideas rather than forcing users back into Clay.

### Execution and monitoring

- Gmail for launch
- Instantly after launch
- AgentMail later

#### Why

Gmail is the right launch sending layer because it is cheap, familiar, and easy for early users to trust. The tradeoff is volume and deliverability control. That is acceptable for the first paid launch.

Instantly is the post-launch execution path for campaign delivery, account rotation, and campaign analytics once Hermes needs higher sending scale.

AgentMail should be used for true agent-native inbox workflows:

- agent-owned inboxes
- autonomous thread handling
- inbox-per-agent or inbox-per-tenant models
- reply/stateful email interactions

## Decision Rules

### Use Websets when

- the task is broad net-new discovery
- the user is describing targets in natural language
- you want a canonical search job with streaming progress

### Use Apify when

- the source is niche or non-standard
- repeated scraping from a known site is needed
- you need structured extraction from a page class or platform
- the data is uniquely available through an actor or marketplace extractor

### Use Apollo when

- you already have a likely person or company identity
- you need email, title, org, seniority, or LinkedIn normalization
- you want one primary enrichment layer instead of chaining many weak ones

### Use Hunter when

- you need email verification
- you need domain-based confidence checks

### Use Gmail when

- the user wants the simplest possible sending setup
- the goal is founder-led or low-volume outbound
- Hermes needs draft/send from a trusted personal inbox quickly

### Use Instantly when

- Hermes has already proven value and needs higher sending volume
- you need campaign analytics and account-level sending controls

### Use AgentMail when

- Hermes needs an actual inbox identity
- the workflow involves replies, inbox state, or autonomous email handling

## Near-Term Build Plan

1. Keep Exa Websets as canonical discovery
2. Add Apollo as optional enrichment after discovery
3. Keep Hunter as verifier/fallback
4. Keep Gmail as the first real outbound execution path
5. Add Instantly once higher-volume execution is needed
6. Add AgentMail once Hermes starts handling reply loops and autonomous agent threads

## Avoid

- making Clay a hard dependency
- making Zapier or n8n a requirement for core workflows
- treating Apify like the primary enrichment layer
- forcing users to think in tool graphs instead of operator goals
