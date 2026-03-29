import {
  buildCanonicalProspectEnrichments,
  buildWebsetEnrichments,
  createExaWebsetsClient,
  createProspectSearchCriteria
} from '@/lib/clients/exa-websets'
import { logger } from '@/lib/utils/logger'
import { getModel, getToolCallModel, isToolCallSupported } from '@/lib/utils/registry'
import { generateObject } from 'ai'
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

const contextualEnrichmentSchema = z.object({
  enrichments: z.array(
    z.object({
      label: z.string().max(48),
      description: z.string().max(220)
    })
  ).max(4)
})

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function compactLabel(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 36)
}

function compactDescription(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 140) return normalized
  const cutoff = normalized.slice(0, 140)
  const lastBoundary = Math.max(cutoff.lastIndexOf('. '), cutoff.lastIndexOf('; '), cutoff.lastIndexOf(', '), cutoff.lastIndexOf(' '))
  return `${cutoff.slice(0, Math.max(0, lastBoundary)).trim() || cutoff.trim()}…`
}

async function generateContextualEnrichments(params: {
  modelId: string
  query: string
  targetPersona?: string
  offer?: string
  previewEnrichments?: Array<{ description?: string }>
}) {
  const { modelId, query, targetPersona, offer, previewEnrichments = [] } = params
  const supportedModel = isToolCallSupported(modelId)
  const currentModel = supportedModel ? getModel(modelId) : getToolCallModel(modelId)

  const baseKeys = new Set(
    buildCanonicalProspectEnrichments(targetPersona).map(enrichment => enrichment.value)
  )

  try {
    const result = await generateObject({
      model: currentModel,
      schema: contextualEnrichmentSchema,
      system: `You design enrichment fields for outbound prospecting.

Return 2 to 4 enrichment fields that materially improve later email drafting for this campaign.

Rules:
- Hermes already collects company name, company domain, company LinkedIn, decision maker name, decision maker title, decision maker LinkedIn, and decision maker email.
- Do not repeat identity basics.
- Prefer outreach-relevant signals: positioning, proof, ICP fit, partnership fit, customer profile, premium indicators, recent activity, differentiators, or program specifics.
- Labels must be short operator labels, ideally 2 to 4 words.
- Descriptions must be one concise extraction instruction, ideally under 110 characters.
- Avoid generic fields like "description" or "industry" unless the brief clearly needs them.
- Avoid niche assumptions not grounded in the user's brief or offer.`,
      prompt: JSON.stringify({
        query,
        targetPersona: targetPersona || null,
        offer: offer || null,
        previewSuggestions: previewEnrichments.map(enrichment => enrichment.description).filter(Boolean)
      })
    })

    const seen = new Set<string>()
    return result.object.enrichments
      .map(enrichment => ({
        label: compactLabel(enrichment.label),
        value: slugify(enrichment.label),
        description: compactDescription(enrichment.description)
      }))
      .filter(enrichment => {
        if (!enrichment.label || !enrichment.description || baseKeys.has(enrichment.value)) return false
        if (seen.has(enrichment.value)) return false
        seen.add(enrichment.value)
        return true
      })
      .slice(0, 4)
  } catch (error) {
    logger.warn('Failed to generate contextual enrichments:', error)
    return []
  }
}

function assembleInteractiveEnrichments(params: {
  targetPersona?: string
  contextualEnrichments: Array<{ label: string; value: string; description: string }>
}) {
  const canonical = buildCanonicalProspectEnrichments(params.targetPersona).map(enrichment => ({
    ...enrichment,
    description: undefined as string | undefined
  }))
  const contextual = params.contextualEnrichments.map(enrichment => ({
    ...enrichment,
    required: false
  }))

  const merged = [...canonical, ...contextual]
  const seen = new Set<string>()

  return merged
    .filter(enrichment => {
      if (!enrichment?.value || seen.has(enrichment.value)) return false
      seen.add(enrichment.value)
      return true
    })
    .slice(0, 10)
}

export function createProspectSearchTool(model: string) {
  logger.tool('prospect_search', 'Creating prospect search tool for model:', model)
  
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
      logger.tool('prospect_search', 'TOOL EXECUTION STARTED!')
      logger.debug('Parameters received:', {
        query,
        targetPersona,
        offer,
        targetCount,
        interactive,
        previewOnly
      })

      // If interactive mode is requested, return UI configuration (seeded via Exa Preview when possible)
      if (interactive) {
        logger.debug('Seeding interactive UI configuration from Exa Preview')
        let initialCriteria: Array<{ label: string; value: string; type: 'job_title' | 'company_type' | 'industry' | 'location' | 'technology' | 'activity' | 'other' }> = []
        let initialEnrichments: Array<{ label: string; value: string; required: boolean; description?: string }> = []
        let initialEntityType: 'person' | 'company' = 'company'
        let initialCustomEnrichments: Array<{ label: string; value: string; description: string }> = []

        try {
          const exaClient = createExaWebsetsClient()
          const preview = await exaClient.previewWebset(query, 'company')
          initialEntityType = 'company'
          initialCriteria = (preview.search?.criteria || []).slice(0, 3).map(c => ({
            label: c.description,
            value: c.description,
            type: 'other' as const
          }))

          const contextualEnrichments = await generateContextualEnrichments({
            modelId: model,
            query,
            targetPersona,
            offer,
            previewEnrichments: preview.enrichments
          })
          initialCustomEnrichments = contextualEnrichments
        } catch (error) {
          logger.warn('Exa preview failed, using raw query criterion:', error)
          initialCustomEnrichments = await generateContextualEnrichments({
            modelId: model,
            query,
            targetPersona,
            offer
          })
        }

        if (initialCriteria.length === 0) {
          initialEntityType = 'company'
          initialCriteria = [{ label: query, value: query, type: 'other' as const }]
        }

        initialEnrichments = assembleInteractiveEnrichments({
          targetPersona,
          contextualEnrichments: initialCustomEnrichments
        })

        const result = {
          type: 'interactive_ui',
          component: 'ProspectSearchBuilder',
          props: {
            initialCriteria,
            initialEnrichments,
            initialCustomEnrichments: [],
            initialEntityType,
            initialCount: targetCount,
            previewMode: previewOnly,
            originalQuery: query,
            targetPersona, // Pass through for later use when finding right person
            offer, // Pass through for context-aware enrichments
            step: 1,
            totalSteps: 5
          },
          message: 'Search configured.'
        }
        logger.debug('Returning interactive UI result')
        return result
      }

      // Otherwise, execute the search immediately
      try {
        logger.debug('Executing immediate search...')
        
        const exaClient = createExaWebsetsClient()

        const preview = await exaClient.previewWebset(query, 'company')
        const allCriteria = (preview.search?.criteria || []).map(c => ({
          label: c.description,
          value: c.description,
          type: 'other' as const
        }))

        const websetSearchConfig = createProspectSearchCriteria({
          query,
          targetCount: Math.min(targetCount, 1000),
          entityType: 'company',
          includeEnrichments: buildCanonicalProspectEnrichments(targetPersona).map(enrichment => enrichment.value),
          allCriteria,
          filters: {}
        })

        const contextualEnrichments = await generateContextualEnrichments({
          modelId: model,
          query,
          targetPersona,
          offer,
          previewEnrichments: preview.enrichments
        })

        const websetEnrichments = buildWebsetEnrichments([
          ...assembleInteractiveEnrichments({
            targetPersona,
            contextualEnrichments
          })
        ])

        const webset = await exaClient.createWebset({
          search: websetSearchConfig,
          enrichments: websetEnrichments
        })
        
        logger.debug('Webset created:', webset.id)
        
        // Return streaming configuration for real-time updates
        return {
          type: 'prospect_search_start',
          event: 'start',
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
        logger.error('Error during prospect search:', error)
        
        return {
          type: 'prospect_search_error',
          event: 'error',
          message: `Failed to start prospect search: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  })
  
  logger.tool('prospect_search', 'Prospect search tool created successfully')
  return prospectSearchTool
} 
