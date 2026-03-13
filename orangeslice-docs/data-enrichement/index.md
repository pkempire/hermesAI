---
name: data-enrichment
description: Patterns for enriching company data, tech stack detection, hiring detection, linkedin enrichment etc...
---

# Data Enrichment

Standard pattern: **Search → Scrape → Extract**

1. `web.search` with `site:` to find subpages likely to contain the data
2. `scrape.website` to get page content as markdown
3. `ai.generateObject` to extract structured fields

---

## Example: Does this law firm handle medical malpractice?

```ts
async function checkMedMalPractice(domain: string) {
   // 1. Search for practice area pages
   const { results } = await services.web.search({
      query: `site:${domain} practice areas medical malpractice`
   });

   if (!results.length) return { handlesMedMal: false };

   // 2. Scrape the top result
   const { markdown } = await services.scrape.website({ url: results[0].link });

   // 3. Extract structured answer
   const { object } = await services.ai.generateObject({
      prompt: `Does this law firm handle medical malpractice cases?\n\n${markdown}`,
      schema: z.object({
         handlesMedMal: z.boolean(),
         practiceAreas: z.array(z.string()).describe("All practice areas listed")
      })
   });

   return object;
}
```

---

## When to Use

| Use Search → Scrape → Extract    | Use `browser.execute` instead |
| -------------------------------- | ----------------------------- |
| Data spread across unknown pages | Same template across pages    |
| Varied/unknown page structure    | Need specific CSS selectors   |
| One-off enrichment               | Scraping lists or many pages  |
