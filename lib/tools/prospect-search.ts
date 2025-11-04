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

        // Skip slow GPT extraction - use simple parsing instead
        const extractParametersFromQuery = async (queryText: string) => {
          // FAST: Simple extraction without GPT call
          initialEntityType = 'company' // Always company for B2B
          
          // Simple criteria extraction
          const criteria = [{
            label: queryText.substring(0, 100) || queryText,
            value: queryText,
            type: 'other' as const
          }]
          
          return { criteria, enrichments: [] }
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

        // FAST: Skip slow GPT generation, use simple defaults
        try {
          // Use simple extraction instead of slow GPT call
          const extracted = await extractParametersFromQuery(query)
          initialCriteria = extracted.criteria
          initialEntityType = 'company'
          
          // Use standard enrichments (fast, no GPT needed)
          initialEnrichments = [
            { label: 'Company Name', value: 'company_name', required: true },
            { label: 'Company Domain', value: 'company_domain', required: true },
            { label: 'Company LinkedIn', value: 'company_linkedin', required: false },
            { label: 'Industry', value: 'industry', required: false },
            { label: 'Company Size', value: 'company_size', required: false },
            { label: 'Location', value: 'location', required: false }
          ]
        } catch (error) {
          console.error('❌ [prospectSearchTool] Error in fast extraction:', error)
          initialEntityType = 'company'
          initialCriteria = [{ label: query, value: query, type: 'other' as const }]
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