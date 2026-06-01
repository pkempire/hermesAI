# Hermes Agent Orchestration Architecture

Hermes should not become a wrapper around Exa, Orangeslice, Apify, Hunter, and
Gmail. The product should be an opinionated GTM execution layer that turns a
plain-English goal into a typed workflow, runs the right enrichment graph, keeps
evidence and memory attached, and stops at the right approval gates.

The core design principle:

> The model plans and adapts. Deterministic code executes, validates, caches,
> scores, and records every step.

## Product Boundary

Hermes is valuable versus "just give Claude Exa and Gmail" when it owns these
things:

- Workflow state: every run has steps, statuses, artifacts, costs, retries, and
  provenance.
- Source routing: Hermes chooses the right data source for the job instead of
  dumping every connector into the prompt.
- Evidence normalization: every company, person, review, post, job, and contact
  result lands in one canonical shape.
- Contact waterfall: email and phone lookup are handled as a confidence-scored
  enrichment pipeline, not an LLM guess.
- Review UI: the user can inspect why an account matched before drafting or
  sending.
- Memory: Hermes remembers the user's offer, ICP, exclusions, winning hooks,
  bad sources, and prior campaign learnings.
- Action gates: expensive, risky, or external actions require approval unless a
  deterministic automation explicitly allows them.

## Capability Registry

Every integration should be exposed internally as a capability, not as a raw
vendor client. A capability is a typed, measurable building block with a stable
contract.

```ts
type CapabilityStage =
  | 'discover'
  | 'source_extract'
  | 'company_enrich'
  | 'person_resolve'
  | 'contact_enrich'
  | 'evidence_score'
  | 'draft'
  | 'execute'

type CapabilityMode = 'deterministic' | 'agent_assisted' | 'approval_required'

interface CapabilityDefinition<Input, Output> {
  id: string
  label: string
  stage: CapabilityStage
  mode: CapabilityMode
  inputSchema: z.ZodType<Input>
  outputSchema: z.ZodType<Output>
  estimatedLatencyMs: number
  costUnits: (input: Input) => number
  cacheKey: (input: Input, userId: string) => string | null
  ttlSeconds: number
  piiLevel: 'none' | 'business' | 'personal' | 'sensitive'
  concurrency: number
  execute: (input: Input, ctx: CapabilityContext) => Promise<Output>
}
```

Capability outputs must include:

- `source`: vendor or crawl source.
- `sourceUrl`: the best inspectable URL.
- `retrievedAt`: timestamp.
- `confidence`: 0 to 1.
- `provenance`: raw ids, external run ids, URLs, and extraction method.
- `errors`: machine-readable failures, not just text.

This is the layer where Orangeslice, Exa, Apify, Apollo, Hunter, Gmail, and
future MCP servers plug in.

## Canonical Entities

Use canonical objects across the app so workflows can chain without bespoke
glue code.

```ts
interface CompanyEntity {
  id: string
  name: string
  domain?: string
  websiteUrl?: string
  linkedinUrl?: string
  googleMapsUrl?: string
  location?: string
  industry?: string
  sourceRefs: SourceRef[]
}

interface PersonEntity {
  id: string
  fullName: string
  title?: string
  companyId?: string
  linkedinUrl?: string
  email?: VerifiedContact
  phone?: VerifiedContact
  sourceRefs: SourceRef[]
}

interface EvidenceSignal {
  id: string
  companyId?: string
  personId?: string
  kind:
    | 'google_review'
    | 'job_post'
    | 'funding'
    | 'conference_sponsor'
    | 'website_claim'
    | 'social_post'
    | 'tech_stack'
    | 'directory_listing'
  text: string
  sourceUrl: string
  happenedAt?: string
  confidence: number
}
```

## Workflow Runs

The chat should start a workflow, not directly block on long-running vendor
calls.

Recommended tables:

- `workflow_runs`
  - `id`, `user_id`, `template_id`, `status`, `mode`, `goal`, `plan_json`,
    `budget_json`, `created_at`, `completed_at`
- `workflow_steps`
  - `id`, `run_id`, `capability_id`, `status`, `input_json`, `output_json`,
    `error_json`, `started_at`, `completed_at`, `attempt`, `cost_units`
- `workflow_artifacts`
  - `id`, `run_id`, `kind`, `entity_id`, `data_json`, `source_refs_json`
- `entity_cache`
  - canonical companies, people, signals, contacts, and external ids
- `campaign_learnings`
  - durable learnings promoted after user feedback or campaign results

Expose these app APIs:

- `POST /api/workflows/start`
- `GET /api/workflows/:id/events`
- `GET /api/workflows/:id`
- `POST /api/workflows/:id/approve`
- `POST /api/workflows/:id/cancel`
- `GET /api/artifacts/:id`

Expose these MCP tools:

- `hermes.workflow_start`
- `hermes.workflow_status`
- `hermes.workflow_results`
- `hermes.workflow_cancel`
- `hermes.email_draft`
- `hermes.gmail_create_draft`

The current `hermes.prospect_search` MCP tool is a useful first cut, but it is
not enough. A deterministic caller needs a job id, status polling, resumable
results, and stable artifacts.

## Planner And Executor

Split the agent into four layers.

### 1. Intent Parser

Input: user message plus memory.

Output: strict JSON:

```ts
interface GtmWorkflowIntent {
  goal: string
  market: string
  targetAccounts?: string
  targetPersona?: string
  offer?: string
  sourceHints: string[]
  constraints: string[]
  output: 'prospect_list' | 'gmail_drafts' | 'csv' | 'crm_push'
  riskLevel: 'low' | 'medium' | 'high'
}
```

Use strict structured output here. If required fields are missing, ask one short
question or scrape the user's site.

### 2. Tool Router

Input: intent plus capability catalog.

Output: a compact DAG:

```ts
interface WorkflowPlan {
  steps: Array<{
    id: string
    capabilityId: string
    dependsOn: string[]
    inputFrom: Record<string, string>
    approvalRequired?: boolean
  }>
}
```

Do not send every tool schema to the LLM. Group tools by namespace and retrieve
only the relevant capabilities for the task.

### 3. Deterministic Executor

Runs the plan:

- validates every input and output with Zod
- dedupes by idempotency key
- enforces quotas and cost budgets
- caches expensive enrichments
- retries transient failures with backoff
- records step outputs as artifacts
- emits SSE events to the UI
- pauses for approvals

### 4. Agentic Recovery

Only call the model again when the deterministic executor needs judgment:

- source failed and a fallback is needed
- search query produced bad results
- multiple people match the buyer persona
- evidence contradicts itself
- draft angle needs synthesis

## Deterministic Vs Agentic

Keep deterministic:

- API calls and scraping actor execution
- input normalization
- deduplication
- cache reads/writes
- quota and pricing
- contact lookup and verification
- confidence scoring math
- Gmail draft creation
- send/enroll actions
- compliance gates

Let the LLM handle:

- turning messy briefs into structured intent
- deciding whether the brief is underspecified
- choosing a source strategy from a small retrieved capability set
- writing extraction instructions for Exa Websets
- ranking ambiguous contacts when evidence is mixed
- synthesizing evidence into a concise "why this account" note
- drafting outreach from attached evidence
- proposing recovery after failures

## Example Capability: Google Reviews For A Business

This should be a first-class enrichment primitive because it supports huge TAM
workflows for local services, healthcare, agencies, hospitality, franchises,
field services, and property management.

Input can be any of:

- company name plus location
- domain
- Google Maps URL
- LinkedIn company URL
- existing `CompanyEntity`

Deterministic flow:

1. Normalize company identity.
2. Resolve the business to a Google Maps place or CID.
3. Fetch reviews with a pinned Apify actor or direct Places provider.
4. Extract review pain themes, recency, star distribution, and representative
   snippets.
5. Score whether the pain is relevant to the user's offer.
6. Attach `EvidenceSignal[]` to the company.

Schema:

```ts
const googleReviewsInput = z.object({
  companyName: z.string().optional(),
  location: z.string().optional(),
  domain: z.string().optional(),
  googleMapsUrl: z.string().url().optional(),
  linkedinCompanyUrl: z.string().url().optional(),
  maxReviews: z.number().int().min(1).max(100).default(25)
})

const googleReviewsOutput = z.object({
  company: companyEntitySchema,
  place: z.object({
    name: z.string(),
    address: z.string().optional(),
    rating: z.number().optional(),
    reviewCount: z.number().optional(),
    googleMapsUrl: z.string().url().optional()
  }),
  signals: z.array(evidenceSignalSchema),
  painThemes: z.array(z.object({
    theme: z.string(),
    count: z.number(),
    recency: z.string().optional(),
    confidence: z.number()
  })),
  provenance: provenanceSchema
})
```

Do not make the chat model scrape reviews itself. The model can decide that
review pain is useful, but the executor should run the review capability and
return structured evidence.

## Source Routing Rules

Use Exa Websets when:

- the user describes a broad market or weird ICP in natural language
- verification criteria matter
- enrichments should be extracted for every result
- an async search job with streaming progress is acceptable

Use Apify when:

- a known surface has a strong actor: Google Maps, reviews, conferences,
  Instagram, X, ecommerce, directories
- the task needs repeatable extraction from a page class
- the actor exposes an output schema or stable dataset items

Use Orangeslice when:

- resolving LinkedIn/company/person identity
- enriching company/person profiles
- searching B2B entities by LinkedIn/web signals

Use Hunter/Apollo/phone providers when:

- the task requires verified email or phone
- Orangeslice found identity but not contact channels
- the user is ready to create drafts or export contacts

Use Gmail when:

- creating reviewable drafts
- sending only after explicit approval

## Memory Design

Memory should not become a dumping ground.

Store:

- user's product, offer, and proof points
- ICP definitions and exclusions
- preferred territories, verticals, and personas
- approved email style and banned claims
- campaigns that produced good or bad replies
- source reliability by workflow type

Do not store:

- entire transient prospect lists
- raw scraped pages unless explicitly needed
- unverified personal contact data longer than necessary
- prompt chatter that does not change future execution

Memory should be used at workflow start:

1. Recall top 4 to 6 relevant memories.
2. Inject only compact facts into the intent parser.
3. Promote new learnings only after user feedback, reply outcomes, or explicit
   "remember this."

## Performance Model

Long-running work should leave the chat request quickly.

- Chat endpoint: parse intent, return plan or workflow id.
- Workflow executor: runs async steps and emits events.
- UI: subscribes to run events and renders cards as artifacts appear.
- Webhooks: ingest Exa/Apify/vendor events instead of polling where available.
- Cache: entity and evidence cache with source-specific TTLs.
- Batch: contact and enrichment calls run with bounded concurrency.

The current MCP smoke test exposed this clearly: a one-result deterministic
preview returned a Webset start payload quickly when not waiting, but `waitForResults`
timed out while the Webset was still running. That is expected for live
discovery. The product should show durable run state instead of making the model
or MCP client sit on one blocking call.

## First Build Slice

1. Add `lib/capabilities/*` with capability definitions and shared schemas.
2. Implement `google_reviews.lookup` as the first new capability.
3. Add workflow tables and `POST /api/workflows/start`.
4. Add `GET /api/workflows/:id/events` SSE.
5. Refactor prospect search to become `discovery.exa_websets`.
6. Refactor Orangeslice person/company logic into separate capabilities.
7. Add MCP `workflow_start`, `workflow_status`, and `workflow_results`.
8. Make templates compile to workflow plans instead of filling only chat text.

That architecture is the step-function. It turns Hermes from "chat with some
tools" into a GTM operating system with inspectable, reusable, deterministic
execution.
