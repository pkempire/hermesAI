import { createExaWebsetsClient, createProspectEnrichments } from '@/lib/clients/exa-websets'
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
    parameters: prospectSearchSchema,
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
              type: 'criterion' as const
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
                type: 'criterion' as const
              }],
              enrichments: []
            }
          }
        }

        const extracted = await extractParametersFromQuery(query)
        initialCriteria = extracted.criteria

        // Try to get Exa preview to refine our extraction
        try {
          const exa = createExaWebsetsClient()
          const preview = await exa.previewWebset(query, initialEntityType)
          if (preview?.search?.entity?.type) {
            initialEntityType = preview.search.entity.type
          }
          if (preview?.search?.criteria?.length) {
            // Merge with our extracted criteria
            const exaCriteria = preview.search.criteria.map(c => ({
              label: c.description,
              value: c.description,
              type: 'other' as const
            }))
            initialCriteria = [...initialCriteria, ...exaCriteria]
          }
          if (preview?.enrichments?.length) {
            const exaEnrichments = preview.enrichments.map(e => ({
              label: e.description || 'Enrichment',
              value: (e.description || 'enrichment').toLowerCase().replace(/\s+/g, '_'),
              required: true
            }))
            initialEnrichments = [...initialEnrichments, ...exaEnrichments]
          }
        } catch (e) {
          console.warn('⚠️ [prospectSearchTool] Exa Preview failed, using extracted parameters:', e)
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
          if (!existing.has(e.value)) initialEnrichments.push(e)
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
        
        // Create webset search configuration - just use the natural language query
        const websetSearchConfig = {
          query: query,
          count: Math.min(targetCount, 1000), // Respect API limits
          entity: { type: 'person' as const }, // Default to person search
          behavior: 'override' as const
        }
        
        const websetEnrichments = createProspectEnrichments()
        
        console.log('🔧 [prospectSearchTool] Creating webset with config:', websetSearchConfig)
        
        // Create the webset
        const webset = await exaClient.createWebset({
          title: `Prospect Search: ${query}`,
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