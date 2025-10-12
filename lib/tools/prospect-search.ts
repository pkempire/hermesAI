import { createExaWebsetsClient } from '@/lib/clients/exa-websets'
import { tool } from 'ai'
import { z } from 'zod'

const prospectSearchSchema = z.object({
  query: z.string().describe('Natural language description of the prospects you want to find (e.g., "Fintech companies 50-500 employees who have integration marketplaces")'),
  targetPersona: z.string().optional().describe('The person you want to reach at these companies (e.g., "VP of Partnerships", "CTO")'),
  offer: z.string().optional().describe('What you are offering (helps generate contextual enrichments)'),
  targetCount: z.number().optional().default(25).describe('Number of companies to find (default: 25)'),
  interactive: z.boolean().optional().default(true).describe('Show interactive search builder UI'),
  previewOnly: z.boolean().optional().default(false).describe('Run search on just 1 company first for preview/validation')
})

export function createProspectSearchTool(model: string) {
  console.log('🔧 [createProspectSearchTool] Creating prospect search tool for model:', model)
  
  const prospectSearchTool = tool({
    description: 'Search for qualified prospects using AI-powered research. Extract search criteria and enrichments from user campaign descriptions. ALWAYS use interactive: true to show the detailed interactive UI with individual search criteria, enrichments, and preview option.',
    inputSchema: prospectSearchSchema,  
    execute: async ({
      query,
      targetPersona,
      offer,
      targetCount = 25,
      interactive = true,
      previewOnly = false
    }) => {
      console.log('🚀 [prospectSearchTool] TOOL EXECUTION STARTED!')
      console.log('🔍 [prospectSearchTool] Parameters received:', {
        query,
        targetPersona,
        offer,
        targetCount,
        interactive,
        previewOnly
      })

      // If interactive mode is requested, return UI configuration (seeded via Exa Preview when possible)
      if (interactive) {
        console.log('🎨 [prospectSearchTool] Seeding interactive UI configuration from Exa Preview')
        let initialCriteria: Array<{ label: string; value: string; type: 'job_title' | 'company_type' | 'industry' | 'location' | 'technology' | 'activity' | 'other' }> = []
        let initialEnrichments: Array<{ label: string; value: string; required: boolean }> = []
        let initialEntityType: 'person' | 'company' = 'person'
        let initialCustomEnrichments: Array<{ label: string; value: string; description: string }> = []

        // Use GPT-4o to intelligently extract search criteria from natural language
        const extractParametersFromQuery = async (queryText: string) => {
          console.log('🤖 [prospectSearchTool] Using GPT-4o to extract criteria from:', queryText)
          
          try {
            const { generateObject } = await import('ai')
            const { getModel } = await import('@/lib/utils/registry')
            const { z } = await import('zod')
            
            const model = getModel('openai:gpt-5')
            
            const criteriaSchema = z.object({
              entityType: z.enum(['person', 'company']).describe('Whether searching for people or companies'),
              criteria: z.array(z.object({
                description: z.string().describe('Natural language description of this search criterion')
              })).describe('List of specific search criteria extracted from the query')
            })
            
            const result = await generateObject({
              model,
              schema: criteriaSchema,
              prompt: `Extract COMPANY search criteria from this query: "${queryText}"

IMPORTANT: For B2B outbound, we ALWAYS search for COMPANIES first, then find the right person later.

Convert this query into company-level criteria. Examples:

Bad (person-level):
- "Find CTOs at fintech companies"

Good (company-level):
- "Company operates in fintech industry"
- "Company has raised Series A funding"
- "Company has integration marketplace"
- "Company has 50-500 employees"
- "Company recently announced partnerships"

Focus on COMPANY attributes that qualify them as good targets.
Set entityType to 'company' always.`,
              temperature: 0.3
            })
            
            console.log('✅ [prospectSearchTool] GPT-4o extracted criteria:', result.object)
            
            // Convert to our format
            const criteria = result.object.criteria.map(c => ({
              label: c.description,
              value: c.description,
              type: 'other' as const
            }))
            
            initialEntityType = result.object.entityType
            
            return { criteria, enrichments: [] }
          } catch (error) {
            console.error('❌ [prospectSearchTool] Error using GPT-4o for criteria extraction:', error)
            
            // Fallback: ALWAYS search companies (B2B workflow)
            initialEntityType = 'company'
            
            return {
              criteria: [{
                label: queryText,
                value: queryText,
                type: 'other' as const
              }],
              enrichments: []
            }
          }
        }

        // If prompt-only mode is OFF and the prompt is short, prefer Exa preview/minimal criteria
        const PROMPT_ONLY = process.env.EXA_PROMPT_ONLY === 'true'
        if (!PROMPT_ONLY && (query && query.split(' ').length < 12)) {
          try {
            const exaClient = createExaWebsetsClient()
            const preview = await exaClient.previewWebset(query, 'company')
            const previewCriteria = (preview.search?.criteria || []).map(c => ({
              label: c.description,
              value: c.description,
              type: 'other' as const
            }))
            // Trim to top 3 generalized criteria (dedup by stem)
            const seen = new Set<string>()
            const generalized: typeof previewCriteria = []
            for (const c of previewCriteria) {
              const key = c.value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
              const tokens = key.split(' ').filter(Boolean)
              const stem = tokens.slice(0,4).join(' ')
              if (!seen.has(stem)) {
                generalized.push(c)
                seen.add(stem)
              }
              if (generalized.length >= 3) break
            }
            initialEntityType = 'company'
            initialCriteria = generalized.length ? generalized : [{ label: query, value: query, type: 'other' }]
          } catch {}
        }

        // Use the same GPT-4o generation for interactive mode
        try {
          const { generateObject } = await import('ai')
          const { getModel } = await import('@/lib/utils/registry')
          const { z } = await import('zod')
          
          const model = getModel('openai:gpt-5')
          
          const websetPlanSchema = z.object({
            entityType: z.enum(['person', 'company']).describe('Whether searching for people or companies'),
            searchCriteria: z.array(z.object({
              description: z.string().describe('Specific verification criterion'),
              type: z.enum(['job_title', 'company_type', 'industry', 'location', 'technology', 'activity', 'other']).describe('Criterion category'),
              successRate: z.number().min(50).max(95).describe('Expected success rate %')
            })).max(5).describe('Up to 5 search criteria for Exa Websets'),
            enrichments: z.array(z.object({
              name: z.string().describe('Human-readable field name'),
              description: z.string().describe('What data to extract'),
              required: z.boolean().describe('Is this field essential?')
            })).describe('Data enrichment fields to extract')
          })
          
          console.log('🤖 [prospectSearchTool] Generating interactive webset plan with GPT-4o...')
          const websetPlan = await generateObject({
            model,
            schema: websetPlanSchema,
            prompt: `Create a COMPANY-FIRST Exa Websets plan:

Company Query: "${query}"
${targetPersona ? `Target Person: "${targetPersona}"` : ''}
${offer ? `What We Offer: "${offer}"` : ''}

WORKFLOW:
1. Find COMPANIES matching criteria (entity type: company)
2. Exa will later find the right person at each company
3. Generate enrichments that help qualify companies AND personalize outreach

Generate:
1. Entity type: ALWAYS "company"
2. Up to 5 COMPANY-level criteria (NOT person criteria!)
3. Enrichments that are useful for ${offer ? 'our offer' : 'qualifying prospects'}

CRITERIA EXAMPLES (Good - Company-level):
- {description: "Company operates in fintech industry", type: "industry", successRate: 85}
- {description: "Company has 50-500 employees", type: "company_type", successRate: 80}
- {description: "Company has integration marketplace", type: "technology", successRate: 70}
- {description: "Company recently announced partnerships", type: "activity", successRate: 65}

CRITERIA EXAMPLES (Bad - Person-level, don't do this):
- {description: "Person is a VP of Engineering", type: "job_title", successRate: 90}

ENRICHMENT EXAMPLES (context-aware):
${offer?.toLowerCase().includes('partnership') ? `
For partnerships:
- {name: "Marketplace URL", description: "URL of their integration marketplace", required: false}
- {name: "Recent Partnerships", description: "Partnership announcements in last 6 months", required: false}
- {name: "Tech Stack", description: "Technologies they integrate with", required: false}
` : offer?.toLowerCase().includes('api') || offer?.toLowerCase().includes('infrastructure') ? `
For API/infrastructure products:
- {name: "Tech Stack", description: "Current technologies and APIs used", required: false}
- {name: "Engineering Blog", description: "URL of engineering blog or tech posts", required: false}
- {name: "API Scale", description: "API usage scale or growth signals", required: false}
` : `
Generic useful enrichments:
- {name: "Recent Funding", description: "Latest funding round details", required: false}
- {name: "Growth Signals", description: "Recent hiring, expansion, or growth indicators", required: false}
- {name: "Tech Stack", description: "Technologies they use", required: false}
`}

Core enrichments (always include):
- {name: "Company Name", description: "Official company name", required: true}
- {name: "Company Domain", description: "Company website domain", required: true}
- {name: "Company LinkedIn", description: "Company LinkedIn page URL", required: false}

Make sure EVERY enrichment has "required" boolean field.`,
            temperature: 0.3
          })
          
          console.log('✅ [prospectSearchTool] Generated interactive webset plan:', websetPlan.object)
          
          // Convert to UI format
          initialEntityType = websetPlan.object.entityType
          initialCriteria = websetPlan.object.searchCriteria.map(c => ({
            label: c.description,
            value: c.description,
            type: c.type
          }))
          // Map, lowercase keys, de-duplicate, and cap to 10
          const mapped = websetPlan.object.enrichments.map(e => ({
            label: e.name,
            value: e.name.toLowerCase().replace(/\s+/g, '_'),
            required: e.required
          }))
          const seen = new Set<string>()
          initialEnrichments = []
          for (const e of mapped) {
            if (!seen.has(e.value)) {
              initialEnrichments.push(e)
              seen.add(e.value)
            }
            if (initialEnrichments.length >= 10) break
          }
          
        } catch (error) {
          console.error('❌ [prospectSearchTool] Error generating interactive webset plan:', error)
          
          // Fallback to simple extraction
          const extracted = await extractParametersFromQuery(query)
          initialCriteria = extracted.criteria
        }

        // Ensure our core COMPANY enrichments are present
        const coreEnrichments = [
          { label: 'Company Name', value: 'company', required: true },
          { label: 'Company Domain', value: 'domain', required: true },
          { label: 'Company LinkedIn', value: 'companyLinkedIn', required: false },
          { label: 'Company Industry', value: 'industry', required: false },
          { label: 'Company Size', value: 'companySize', required: false },
          { label: 'Company Location', value: 'location', required: false },
          { label: 'Recent Activity', value: 'recentActivity', required: false }
        ]
        // If searching companies, require decision-maker LinkedIn enrichment
        if ((initialEntityType || 'person') === 'company') {
          coreEnrichments.unshift({ label: 'Decision Maker LinkedIn', value: 'decision_maker_linkedin', required: true })
        }
        const existing = new Set(initialEnrichments.map(e => e.value))
        for (const e of coreEnrichments) {
          if (initialEnrichments.length >= 10) break
          if (!existing.has(e.value)) {
            initialEnrichments.push(e)
            existing.add(e.value)
          }
        }

        const result = {
          type: 'interactive_ui',
          component: 'ProspectSearchBuilder',
          props: {
            initialCriteria,
            initialEnrichments,
            initialCustomEnrichments,
            initialEntityType,
            initialCount: targetCount,
            previewMode: previewOnly,
            originalQuery: query,
            targetPersona, // Pass through for later use when finding right person
            offer, // Pass through for context-aware enrichments
            step: 1,
            totalSteps: 5
          },
          message: `**🧠 Here's my analysis of your request:**

I've broken down "${query}" into a structured search:

**🎯 Target Companies:** ${initialCriteria.length} criteria to find the right businesses
${targetPersona ? `**👤 Decision Maker:** Looking for ${targetPersona} at each company\n` : ''}
**📊 Data Collection:** ${initialEnrichments.length} enrichment fields to gather intel${offer ? ' tailored to your offering' : ''}

**🔍 My Approach:**
1. Search for companies matching your criteria
2. Extract key business data for each match
3. Find contact info for your target persona
4. Verify email deliverability where possible

You can **preview with 1 company** first to validate the approach, or **run the full search** for ${targetCount || 25} prospects. Ready when you are!`
        }
        console.log('✅ [prospectSearchTool] Returning interactive UI result:', result)
        return result
      }

      // Otherwise, execute the search immediately
      try {
        console.log('🔍 [prospectSearchTool] Executing immediate search...')
        
        // Create the Exa client
        const exaClient = createExaWebsetsClient()
        
        // Generate intelligent criteria and enrichments using GPT-4o
        const { generateObject } = await import('ai')
        const { getModel } = await import('@/lib/utils/registry')
        const { z } = await import('zod')
        
        const model = getModel('openai:gpt-5')
        
        const websetPlanSchema = z.object({
          entityType: z.enum(['person', 'company']).describe('Whether searching for people or companies'),
          searchCriteria: z.array(z.object({
            description: z.string().describe('Specific verification criterion'),
            successRate: z.number().min(50).max(95).describe('Expected success rate %')
          })).max(5).describe('Up to 5 search criteria for Exa Websets'),
          enrichments: z.array(z.object({
            name: z.string().describe('Human-readable field name'),
            description: z.string().describe('What data to extract from each prospect'),
            format: z.enum(['text', 'json', 'number']).describe('Data format'),
            instructions: z.string().describe('Detailed extraction instructions'),
            required: z.boolean().default(false).describe('Is this field essential?')
          })).describe('Data enrichment fields to extract')
        })
        
        console.log('🤖 [prospectSearchTool] Generating webset plan with GPT-4o...')
        const websetPlan = await generateObject({
          model,
          schema: websetPlanSchema,
          prompt: `Create a focused search plan for: "${query}"

          Target: ${targetPersona || 'decision maker'}
          Context: ${offer ? offer.slice(0, 100) : 'business proposal'}

          Create:
          1. Entity type: "company" (for B2B)
          2. 3-4 specific criteria (keep concise)
          3. Essential enrichments only

          ALWAYS include these enrichments:
          - Company Name (required)
          - Company Domain (required)
          - ${targetPersona || 'Decision Maker'} Contact (required) - LinkedIn profile URL and role verification
          - Employee Count (required)

          Add 2-3 relevant enrichments:
          ${offer?.includes('partner') ? '- Partner Program Details\n- Integration Options' : ''}
          ${offer?.includes('sales') || offer?.includes('CRM') ? '- Tech Stack\n- Recent Growth' : ''}
          ${offer?.includes('recruit') ? '- Job Postings\n- Hiring Activity' : ''}

          Keep criteria short and focused. Example:
          Criteria: ["Fintech company", "50-500 employees", "US-based"]
          Not: ["Company operates primarily in financial technology services sector with demonstrated API infrastructure and modern development practices"]`,
          temperature: 0.3
        })
        
        console.log('✅ [prospectSearchTool] Generated webset plan:', websetPlan.object)
        
        // Create webset search configuration with AI-generated criteria
        const websetSearchConfig = {
          query: query,
          count: Math.min(targetCount, 1000), // Respect API limits
          entity: { type: websetPlan.object.entityType },
          criteria: websetPlan.object.searchCriteria,
          behavior: 'override' as const
        }
        
        // Convert our enrichments to Exa API format
        const websetEnrichments = websetPlan.object.enrichments.map(enrichment => ({
          title: enrichment.name,
          description: enrichment.description,
          format: enrichment.format || 'text',
          instructions: enrichment.instructions
        }))
        
        console.log('🔧 [prospectSearchTool] Creating webset with AI-generated config:', {
          searchConfig: websetSearchConfig,
          enrichmentsCount: websetEnrichments.length
        })
        
        // Create the webset with both search and enrichments
        const webset = await exaClient.createWebset({
          search: websetSearchConfig,
          enrichments: websetEnrichments
        })
        
        console.log('✅ [prospectSearchTool] Webset created:', webset.id)
        
        // Return streaming configuration for real-time updates
        return {
          type: 'streaming_search',
          websetId: webset.id,
          searchCriteria: { query, targetCount },
          status: 'created',
          message: `Started searching for prospects matching "${query}". I'll show you results as they come in.`,
          progress: {
            found: 0,
            analyzed: 0,
            completion: 0
          }
        }
        
      } catch (error) {
        console.error('❌ [prospectSearchTool] Error during prospect search:', error)
        
        return {
          type: 'error',
          message: `Failed to start prospect search: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  })
  
  console.log('✅ [createProspectSearchTool] Prospect search tool created successfully')
  return prospectSearchTool
} 