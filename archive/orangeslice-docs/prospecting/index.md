---
name: prospecting
description: Strategies for searching or finding people and companies. This is a mantatory read before answering any user request regarding finding net new company / people.
---

# Mode: Prospecting

**Goal:** Find companies/people matching user's ICP.

---

## Two Ways to Prospect

### 1. Direct Query with Filters (Preferred)

Run queries with built-in filters when the criteria is searchable:

- **Web search (`services.web.search`)** — **Default for LinkedIn**. Use for keywords, niche queries, fuzzy matching, anything descriptive.
- **Crunchbase (`services.crunchbase.search`)** — **Default for funding data**. Use for funding-stage, round type, amount, date windows, and investor-backed company discovery.
- **LinkedIn B2B DB** — **Indexed lookups ONLY:** company by domain/slug/ID, employees at a known company (by company_id), basic funding (2-table join). Everything else = web search. See [QUICK_REF](./linkedin_data/QUICK_REF.md).
- **Google Maps** — industry, location, ratings
- **LinkedIn job search** — job filters, titles

**Use this when possible.** It's fast and returns pre-filtered results.

### 2. Qualification Columns (When Filters Don't Exist)

Some criteria can't be searched directly:

- "Did this company recently switch software providers?"
- "Are they actively hiring for this role?"
- "Do they use [specific tool]?"

**For these:** Pull a broad list → add columns that answer the question → user filters.

---

## Company-First Prospecting (Recommended for B2B)

Often the best approach is to **find companies first, then find people** at those companies:

1. **Build a companies sheet** — Find companies matching your ICP (industry, size, tech stack, etc.)
2. **Qualify companies** — Add enrichment/verification columns to filter to best-fit companies
3. **Find people at qualified companies** — Search for decision-makers at each company
4. **Push to a new sheet** — Create a separate people sheet linked to the companies

**Why this works better:**

- Company data is often more reliable/searchable than people data
- You can qualify at the company level before spending credits on people
- Avoids pulling people from irrelevant companies
- Creates a clean funnel: Companies → Qualified Companies → People

````

**When to use company-first:**

- B2B sales where company fit matters
- Account-based approaches
- When you want to research companies before reaching out to people
- in this case if you want to find people you should find them by creating a column to fetch them, DO NOT do this in your code sandbox

**When to search people directly:**

- Role-based targeting (all "AI Engineers" regardless of company)
- Personal brand/content-based targeting
- Consumer or SMB where company size doesn't matter

---

## Circle & Star Framework

When using qualification columns, think Circle & Star:

- **Circle (⭕)** = Broad, queryable pool (industry, size, location)
- **Star (⭐)** = Specific criteria you can't query directly

**Golden rule:** Circle large enough to contain all stars, but no larger.

---

## Data Sources: When to Use Each

| Source                   | Use When                                                    | Limitations                                              |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------------- |
| **Web Search (Default)** | **Everything else** — keywords, niche, fuzzy, specific      | Requires verification columns for false positives.       |
| **Crunchbase (Funding Default)** | Funding-focused prospecting: stage, round type, amount, recency, investors | Best for funding intelligence; use other sources for non-funding discovery criteria. |
| **PredictLeads**         | Company intelligence, buying signals, and structured company events at scale | Coverage varies by company/market; use web search for very niche long-tail discovery. |
| **Niche Directory Scrape** | Well-defined categories with existing lists (see below)   | Requires finding the right directory first.              |
| **LinkedIn B2B DB**      | **Indexed lookups ONLY:** company by domain/slug/ID, employees at known company, basic 2-table funding. | **3s hard max. No keyword search, no LATERAL, no 3+ table joins.** Everything else = web search. |
| **Google Maps**          | Local/SMB, physical locations, restaurants, retail          | Limited to businesses with physical presence.            |
| **Apify Actors**         | Platform-specific scraping (Instagram, TikTok, job boards)  | Per-platform setup. May break with platform changes.     |

### PredictLeads: When It Is Better Than Everything Else

Use PredictLeads first when the user needs **high-quality structured company data** and not just URLs.

PredictLeads is usually the best choice for:
- Tracking **company signals over time** (news, financing, hiring, tech detections, product changes, website evolution)
- Pulling **normalized lists** (job openings, technologies, investors/connections, similar companies) without custom scraping
- Building qualification columns where consistency matters more than recall
- Workflows that need stable structured fields instead of parsing search snippets

Prefer other sources when:
- You need **brand-new niche discovery** with fuzzy intent matching -> use `web.search`
- You need local storefront/SMB discovery -> use Google Maps
- You need fast indexed LinkedIn lookups by known IDs/domain/company -> use LinkedIn B2B DB

### Funding Prospecting Standard: Use Crunchbase First

For any request centered on funding data (for example: "Series A fintech companies", "companies that raised in the last 12 months", "recently funded startups"), use `services.crunchbase.search` as the **standard/default source**.

Use LinkedIn B2B DB funding joins only when the user explicitly needs a LinkedIn-only workflow or a narrow lookup tied to existing LinkedIn records. Otherwise, Crunchbase should be the first choice for funding-oriented discovery.

### Niche Directory Scraping — For Well-Defined Categories

When users ask for companies in a **specific, well-defined niche** (e.g., "fast food chains", "Fortune 500 companies", "Y Combinator startups"), the best approach is often to **find and scrape a curated directory or list**.

**When to use directory scraping:**

- User asks for a comprehensive list of companies in a known category
- The category has well-known directories, Wikipedia lists, or industry databases
- You need a complete/authoritative list rather than search results

**Examples:**

| User Request                    | Best Source                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| "Fast food chains"              | `https://en.wikipedia.org/wiki/List_of_fast_food_restaurant_chains`      |
| "Fortune 500 companies"         | Fortune's official list or Wikipedia                                     |
| "Y Combinator companies"        | YC's company directory                                                   |
| "Unicorn startups"              | CB Insights unicorn list                                                 |
| "Law firms in AmLaw 100"        | AmLaw's official ranking                                                 |

**How to scrape:** Use [`browser.execute`](../services/browser/execute.md) to extract data from the directory.


**Tip:** First use web search to find the best directory for the niche, then scrape it.

---

## 🚨 Critical: Web Search vs B2B Database

### Web Search (`services.web.search`) — DEFAULT CHOICE

**Use web search for everything unless the query is purely industry/title or high volume and willing to sadrifice q**

Web search handles:
- Keywords, product names, technologies ("AI CRM", "Salesforce", "React")
- Niche/specific queries ("climate tech founders", "Series A fintech")
- Fuzzy matching (anything that's hard to express as exact filters)
- Any descriptive criteria (company descriptions, headlines, bios)
- Small-to-medium result sets (10-500 results)

```
site:linkedin.com/company "AI CRM"
site:linkedin.com/in "VP Sales" "fintech"
```

Web search is fast, cheap, and works for almost everything. **When in doubt, use web search.**

### LinkedIn B2B Database — LOOKUP TOOL ONLY

> **The LinkedIn DB is a lookup tool, not a search engine.** Only fast indexed queries are allowed (under 3 seconds, max 2-table joins). Everything else falls back to `services.web.search` with `site:linkedin.com` patterns. **You MUST read `services/web/search` before using web search.**

> **🚨 CRITICAL: ALWAYS SAVE LINKEDIN DB RESULTS TO A FILE 🚨**
> LinkedIn B2B database queries are **billed per execution**. You **MUST** persist query results immediately using `fs.writeFile("files/<name>.json", JSON.stringify(rows))`. If you return results without saving them, the query must be re-run — **double-charging the user**. Never discard, summarize-only, or preview LinkedIn DB results without also writing them to a file in the same step.

**ALLOWED queries (all under 3s, max 2-table joins):**
- Company by domain/slug/ID (4-8ms)
- Employees at a known company by company_id (8-32ms)
- Basic funding with 2-table join (10-99ms)
- Certifications (160-312ms)
- Education-only queries (83-257ms)
- Common headline terms ONLY: engineer, CEO, manager, sales, developer, founder (51-161ms)

**BANNED queries — use web search instead:**
- ❌ Description/keyword search (ILIKE on description = 10s)
- ❌ Jobs by role (LATERAL = 28s timeout)
- ❌ 3+ table joins (1s-17s)
- ❌ Skills queries (timeout)
- ❌ Rare headline terms (timeout)
- ❌ UNION ALL for multiple companies (14.6s)
- ❌ company_name ILIKE (813ms-11.7s)

**Example ALLOWED queries:**
- "Find employees at Stripe" (company_id lookup)
- "Companies with Series A funding" (2-table join)

**Example BANNED queries — use web search:**
- "AI CRM companies" → `services.web.search("site:linkedin.com/company AI CRM")`
- "Kubernetes engineers" → `services.web.search("site:linkedin.com/in kubernetes engineer")`
- "VPs who worked at Google" → `services.web.search("site:linkedin.com/in VP Google")`
- "Companies hiring Account Executives" → `services.web.search("site:linkedin.com/jobs Account Executive")`

## Fast but Requires Verification

**Web search for people/companies is super fast and reliable** — you can pull 50-100 LinkedIn URLs in seconds by running parallel queries. But **it often returns false positives** because Google matches keywords loosely.

**Example: "AI CRM" companies**

```ts
// Step 1: Fast web search to get candidate URLs
const results = await services.web.search({
   query: '"AI CRM" OR "AI-powered CRM" site:linkedin.com/company'
});
const companyUrls = results.results.map((r) => r.link);

// Step 2: Add to sheet
await sheet.addRows(
   companyUrls.map((url) => ({ linkedin_url: url })),
   { create: true }
);

🚨 WEB SEARCH REQUIRES VERIFICATION 🚨
When using web search to find companies or people, you MUST add:
1. An enrichment column (LinkedIn enrich or scrape)
2. A verification column (AI check: "Does this actually match the criteria?")
NEVER deliver web search results without verification columns. Web search produces false positives.

````

```ts
type search = (params: {
   query: string;
   domain?: string; // Restrict results to this domain
   advance_search?: boolean; // Enable knowledge graph
   page?: number; // 1-indexed, default 1
   tbs?: string; // Time/filter param (see below)
}) => Promise<{
   results: Array<{
      title: string;
      link: string;
      displayed_link: string;
      snippet: string;
   }>;
   knowledgeGraph: { title; description; image; website; hours_links };
   pagination: { currentPage; totalPages; totalResults; hasNextPage };
}>;
```

## Create Useful Views After Prospecting

Once a prospecting workflow is set up, **always create a few views**. Views show up as colored tabs in the sheet bar so switching is instant.

Use `ctx.sql()` with `CREATE VIEW ... ON ... AS SELECT ...`.

**Prefer sorted views over filtered views.** A sorted view keeps ALL rows visible but groups the best ones at the top — the user sees qualified leads first and can scroll to see the rest. Filtered views hide rows, making it hard to judge how much work went into finding the qualified ones.

```ts
// Sorted view — qualified at top, rest below (preferred)
await ctx.sql(
   `CREATE VIEW "Best First" ON "Companies" AS SELECT * FROM "Companies" ORDER BY "Qualified" DESC, "Score" DESC`
);

// Sorted by score
await ctx.sql(`CREATE VIEW "By Score" ON "Companies" AS SELECT * FROM "Companies" ORDER BY "Score" DESC`);

// Grouped by category
await ctx.sql(`CREATE VIEW "By Industry" ON "Companies" AS SELECT * FROM "Companies" ORDER BY "Industry" ASC`);

// Only use WHERE filters for hard exclusions
await ctx.sql(`CREATE VIEW "Errors Only" ON "Companies" AS SELECT * FROM "Companies" WHERE "Status" = 'failed'`);
```

Don't overthink it — just create 2-3 views that match the columns you built. Skip only if there's genuinely nothing to sort/group on.

## Examples

| User Request                                 | Approach         | Why                                                                         |
| -------------------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| "AI CRM companies"                           | Web search       | Keyword query → `"AI CRM" site:linkedin.com/company`                        |
| "Fintech startups"                           | Web search       | Fuzzy/descriptive → `"fintech" "startup" site:linkedin.com/company`         |
| "SDRs at Series A companies"                 | Web search       | Specific criteria → `"SDR" "Series A" site:linkedin.com/in`                 |
| "Series A/B companies raised last year"      | Crunchbase       | Funding-specific discovery is best handled via `services.crunchbase.search` |
| "Companies using Kubernetes"                 | Web search       | Technology match → `"Kubernetes" site:linkedin.com/company`                 |
| "VPs who worked at Google"                   | Web search       | Fuzzy history match → `"VP" "Google" site:linkedin.com/in`                  |
| "1000 software engineers in Bay Area"        | B2B DB           | Simple title + location + high volume                                       |
| "All healthcare companies 100-500 employees" | B2B DB           | Industry + size + high volume                                               |
| "Fast food chains that..."                   | Directory scrape | Scrape Wikipedia list → `browser.execute`                                   |
| "Restaurants in Austin"                      | Google Maps      | Local/SMB with physical presence                                            |
| "Companies hiring SDRs"                      | LinkedIn Jobs    | Job search with title filter                                                |
| "Warehouses implementing WMS"                | Circle + columns | Pull logistics companies → add "WMS Score" column                           |
| "Companies that recently switched CRMs"      | Circle + columns | Pull SaaS companies → add "CRM Change Signals" column                       |

---

## Tools

- **LinkedIn:** `services.company.linkedin.search({ sql: "SELECT ... FROM linkedin_company ..." })`, `services.person.linkedin.search({ sql: "SELECT ... FROM linkedin_profile ..." })` — **Lookup tool only, 3s max, 2-table joins max. Use web search for anything else.**
- **Funding:** `services.crunchbase.search({ sql: "SELECT ... FROM ... WHERE ..." })` — **Default for funding search and screening.**
- **Local/SMB:** `googleMaps.scrape`
- **Web:** `web.search` + `browser.execute`
- **Platforms:** `services.apify.runActor`

Refuse unreasonable volume requests (1k+ rows at once). Slow iteration is fine.
