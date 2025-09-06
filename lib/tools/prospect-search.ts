import { createExaWebsetsClient } from '@/lib/clients/exa-websets'
import { tool } from 'ai'
import { z } from 'zod'

const prospectSearchSchema = z.object({
  query: z.string().describe('Natural language description of the prospects you want to find (e.g., "CTOs at fintech companies who posted about API scaling issues")'),
  targetCount: z.number().optional().default(25).describe('Number of prospects to find (default: 25)'),
  interactive: z.boolean().optional().default(true).describe('Show interactive search builder UI'),
  previewOnly: z.boolean().optional().default(false).describe('Run search on just 1 prospect first for preview/validation')
})

export function createProspectSearchTool(model: string) {
  console.log('🔧 [createProspectSearchTool] Creating prospect search tool for model:', model)
  
  const prospectSearchTool = tool({
    description: 'Search for qualified prospects using AI-powered research. Extract search criteria and enrichments from user campaign descriptions. ALWAYS use interactive: true to show the detailed interactive UI with individual search criteria, enrichments, and preview option.',
    inputSchema: prospectSearchSchema,
    execute: async ({
      query,
      targetCount = 25,
      interactive = true,
      previewOnly = false
    }) => {
      console.log('🚀 [prospectSearchTool] TOOL EXECUTION STARTED!')
      console.log('🔍 [prospectSearchTool] Parameters received:', {
        query,
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
            
            const model = getModel('openai:gpt-4o')
            
            const criteriaSchema = z.object({
              entityType: z.enum(['person', 'company']).describe('Whether searching for people or companies'),
              criteria: z.array(z.object({
                description: z.string().describe('Natural language description of this search criterion')
              })).describe('List of specific search criteria extracted from the query')
            })
            
            const result = await generateObject({
              model,
              schema: criteriaSchema,
              prompt: `Extract search criteria from this prospect search query: "${queryText}"
              
              Break down the query into specific, actionable search criteria. Each criterion should be a clear statement that can be verified. Examples:
              - "Prospect is a Chief Technology Officer" 
              - "Prospect works at a company with 50-200 employees"
              - "Prospect has posted about API scaling issues on LinkedIn in the last 2 months"
              - "Company operates in the fintech industry"
              - "Company has raised Series A funding"
              
              Focus on extracting specific, verifiable criteria that will help find the right prospects.`,
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
            
            // Fallback to simple extraction
            const hasJobTitles = /(?:cto|ceo|cmo|cfo|chief|director|manager|head of|vp|vice president|engineer|developer)/gi.test(queryText)
            initialEntityType = hasJobTitles ? 'person' : 'company'
            
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

        // Use the same GPT-4o generation for interactive mode
        try {
          const { generateObject } = await import('ai')
          const { getModel } = await import('@/lib/utils/registry')
          const { z } = await import('zod')
          
          const model = getModel('openai:gpt-4o')
          
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
            prompt: `Create an Exa Websets plan for the interactive UI: "${query}"
            
            Generate:
            1. Entity type (person or company)
            2. Up to 5 categorized search criteria with types (job_title, company_type, industry, location, technology, activity, other)
            3. Enrichment fields with clear names and required status (MUST include the required boolean field)
            
            IMPORTANT: Each enrichment MUST have a "required" boolean field set to true or false.
            
            Example for "VPs of Engineering at fintech companies":
            - Criteria: [
                {description: "Person holds VP of Engineering or similar title", type: "job_title", successRate: 90},
                {description: "Person works at a fintech company", type: "company_type", successRate: 85},
                {description: "Company has 50-500 employees", type: "company_type", successRate: 75}
              ]
            - Enrichments: [
                {name: "Full Name", description: "Person's complete name", required: true},
                {name: "Email", description: "Contact email address", required: true},
                {name: "LinkedIn", description: "LinkedIn profile URL", required: false},
                {name: "Job Title", description: "Current job title", required: true},
                {name: "Company", description: "Current company name", required: true}
              ]
            
            Make sure EVERY enrichment object includes the "required" boolean field.`,
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

        // Ensure our core enrichments are present
        const coreEnrichments = [
          { label: 'Full Name', value: 'fullName', required: true },
          { label: 'Job Title', value: 'jobTitle', required: true },
          { label: 'Company Name', value: 'company', required: true },
          { label: 'Email Address', value: 'email', required: true },
          { label: 'LinkedIn URL', value: 'linkedin', required: false },
          { label: 'Phone Number', value: 'phone', required: false },
          { label: 'Location', value: 'location', required: false },
          { label: 'Company Industry', value: 'industry', required: false },
          { label: 'Company Size', value: 'companySize', required: false },
          { label: 'Recent Activity', value: 'recentActivity', required: false }
        ]
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
            step: 1,
            totalSteps: 5
          },
          message: `I've analyzed your campaign and extracted ${initialCriteria.length} search criteria and ${initialEnrichments.length} enrichments. Review and refine these parameters, then choose to preview 1 result first or run the full search.`
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
        
        const model = getModel('openai:gpt-4o')
        
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
          prompt: `Create a comprehensive Exa Websets search plan for: "${query}"
          
          Generate:
          1. Entity type (person or company)
          2. Up to 5 specific search criteria that prospects must match
          3. Data enrichments to extract for each found prospect with names and required status
          
          Example for "VPs of Engineering at fintech companies":
          - Entity: person
          - Criteria: ["Person holds VP of Engineering title", "Person works at a fintech company", "Company has 50-500 employees"]
          - Enrichments: [
              {name: "Full Name", description: "Person's complete name", format: "text", instructions: "Extract first and last name", required: true},
              {name: "Email", description: "Contact email address", format: "text", instructions: "Find professional email", required: true},
              {name: "LinkedIn", description: "LinkedIn profile URL", format: "text", instructions: "Extract LinkedIn profile link", required: false}
            ]
          
          Be specific and actionable. Focus on criteria that can be verified from web content.`,
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