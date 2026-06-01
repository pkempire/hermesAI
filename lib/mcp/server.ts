/**
 * Hermes MCP server factory.
 *
 * Exposes the existing in-app AI tools (lib/tools/*) over the Model Context
 * Protocol so external agents (Claude Desktop, Cursor, Windsurf, MCP Inspector)
 * can call them directly. The wrapper does NOT reimplement business logic — it
 * delegates to the same `tool({ ... })` instances that power the agent loop.
 *
 * SDK: @modelcontextprotocol/sdk@1.26.0
 *      https://www.npmjs.com/package/@modelcontextprotocol/sdk
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { createEnrichmentDescriptionMap, createExaWebsetsClient } from '@/lib/clients/exa-websets'
import { enrichProspectWithOrangeslice } from '@/lib/clients/orangeslice'
import { createEmailDrafterTool } from '@/lib/tools/email-drafter'
import { createProspectSearchTool } from '@/lib/tools/prospect-search'
import { createScrapeSiteTool } from '@/lib/tools/scrape'

export interface HermesMcpOptions {
  /**
   * Default model id used by tools that need an LLM internally
   * (e.g. prospect_search uses it for contextual enrichment generation).
   * Override via env HERMES_MCP_MODEL.
   */
  defaultModel?: string
}

const SERVER_NAME = 'hermes'
const SERVER_VERSION = '0.1.0'

/**
 * Register Hermes tools on an existing McpServer instance.
 * Used by both the stdio entrypoint and the Streamable HTTP route handler so
 * the tool surface stays in lockstep across transports.
 */
export function registerHermesTools(server: McpServer, opts: HermesMcpOptions = {}) {
  const model =
    opts.defaultModel ||
    process.env.HERMES_MCP_MODEL ||
    'openai:gpt-5-mini'

  // Reuse the SAME factories that the chat agent uses. We invoke `.execute`
  // directly rather than going through the AI SDK runtime.
  const prospectTool = createProspectSearchTool(model)
  const drafterTool = createEmailDrafterTool()
  const scrapeTool = createScrapeSiteTool()

  // Minimal AI-SDK tool execution context. The wrapped tools do not rely on
  // these fields, so a stub satisfies the type at runtime.
  const toolCtx: any = { toolCallId: 'mcp', messages: [] }

  // ---------------------------------------------------------------------------
  // hermes.prospect_search
  // ---------------------------------------------------------------------------
  server.registerTool(
    'hermes.prospect_search',
    {
      title: 'Find B2B prospects',
      description:
        'Search for qualified B2B prospects (companies + decision makers) using ' +
        'Exa Websets + AI-powered enrichment. Returns a webset id and starting ' +
        'metadata; results stream into the Hermes app over time.',
      inputSchema: {
        query: z
          .string()
          .min(3)
          .describe(
            'Natural language description of the prospects you want to find ' +
              '(e.g. "Fintech companies 50-500 employees with integration marketplaces").'
          ),
        targetPersona: z
          .string()
          .optional()
          .describe('Person you want to reach (e.g. "VP of Partnerships").'),
        offer: z
          .string()
          .optional()
          .describe('What you are offering — used to seed contextual enrichments.'),
        targetCount: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe('Number of companies to find. Default 25.'),
        previewOnly: z
          .boolean()
          .optional()
          .describe('Run a one-result preview instead of a full search.'),
        waitForResults: z
          .boolean()
          .optional()
          .describe('Wait for Exa to finish and return enriched prospects in the MCP response. Best for deterministic automations.'),
        timeoutMs: z
          .number()
          .int()
          .min(5_000)
          .max(60_000)
          .optional()
          .describe('Max time to wait when waitForResults is true. Default 45 seconds.')
      }
    },
    async args => {
      const targetCount = args.previewOnly ? 1 : args.targetCount ?? 25
      const result = await prospectTool.execute!(
        {
          query: args.query,
          targetPersona: args.targetPersona,
          offer: args.offer,
          targetCount,
          // External agents always get the headless flow, never the in-app UI.
          interactive: false,
          previewOnly: Boolean(args.previewOnly)
        } as any,
        toolCtx
      )

      if (
        args.waitForResults &&
        result &&
        typeof result === 'object' &&
        (result as any).type === 'prospect_search_start' &&
        typeof (result as any).websetId === 'string'
      ) {
        const exa = createExaWebsetsClient()
        const webset = await exa.waitUntilIdle((result as any).websetId, {
          timeout: args.timeoutMs ?? 45_000,
          pollInterval: 2_000
        })
        const items = await exa.listItems((result as any).websetId, {
          limit: Math.min(targetCount, 100)
        })
        const enrichmentDescriptions = createEnrichmentDescriptionMap(webset as any)
        const prospects = await Promise.all(
          (items.data || []).map(item =>
            enrichProspectWithOrangeslice(exa.convertToProspect(item, enrichmentDescriptions), {
              originalQuery: args.query,
              targetPersona: args.targetPersona,
              offer: args.offer
            })
          )
        )

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...result,
              type: 'prospect_search_complete',
              event: 'complete',
              prospects,
              summary: {
                query: args.query,
                entityType: 'company',
                totalFound: prospects.length,
                websetId: (result as any).websetId,
                preview: Boolean(args.previewOnly)
              }
            }, null, 2)
          }]
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  // ---------------------------------------------------------------------------
  // hermes.email_draft
  // ---------------------------------------------------------------------------
  server.registerTool(
    'hermes.email_draft',
    {
      title: 'Draft outreach emails',
      description:
        'Open the Hermes email drafter for a list of prospects. Returns the ' +
        'drafter configuration (template seeds + personalization controls).',
      inputSchema: {
        prospects: z
          .array(
            z.object({
              id: z.string(),
              fullName: z.string().optional(),
              jobTitle: z.string().optional(),
              company: z.string().optional(),
              email: z.string().optional(),
              linkedinUrl: z.string().optional()
            })
          )
          .optional(),
        summary: z
          .object({
            query: z.string().optional(),
            entityType: z.string().optional(),
            totalFound: z.number().optional()
          })
          .optional()
      }
    },
    async args => {
      const result = await drafterTool.execute!(
        {
          prospects: args.prospects ?? [],
          summary: args.summary
        } as any,
        toolCtx
      )

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  // ---------------------------------------------------------------------------
  // hermes.scrape_site
  // ---------------------------------------------------------------------------
  server.registerTool(
    'hermes.scrape_site',
    {
      title: 'Scrape company website',
      description:
        'Scrape a company website and return a compact offer snapshot ' +
        '(company, offer, target audience, why-it-matters, proof points).',
      inputSchema: {
        url: z
          .string()
          .url()
          .describe('Root URL to analyze, e.g. https://example.com')
      }
    },
    async args => {
      const result = await scrapeTool.execute!({ url: args.url } as any, toolCtx)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  return server
}

/**
 * Build a fully configured Hermes MCP server. Used by `bin/hermes-mcp` (stdio)
 * and by `app/api/mcp/route.ts` (Streamable HTTP via mcp-handler).
 */
export function createHermesMcpServer(opts: HermesMcpOptions = {}): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION
  })
  registerHermesTools(server, opts)
  return server
}

export const HERMES_MCP_INFO = {
  name: SERVER_NAME,
  version: SERVER_VERSION
} as const
