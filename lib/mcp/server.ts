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

import { createEmailDrafterTool } from '@/lib/tools/email-drafter'
import { createProspectSearchTool } from '@/lib/tools/prospect-search'
import { createScrapeSiteTool } from '@/lib/tools/scrape'
import { getRunByWebsetId, getRunSnapshot } from '@/lib/workflows/prospect-run-store'

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
          .describe('Deprecated compatibility flag. Hermes now returns a durable run handle; call hermes.get_run to read results.'),
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

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...result,
            nonBlocking: true,
            resultMode: 'durable_run_handle',
            next: 'Call hermes.get_run with the returned websetId to read status and prospects.'
          }, null, 2)
        }]
      }
    }
  )

  // ---------------------------------------------------------------------------
  // hermes.get_run
  // ---------------------------------------------------------------------------
  server.registerTool(
    'hermes.get_run',
    {
      title: 'Read campaign run state',
      description:
        'Return the current durable state for a Hermes prospecting run, including streamed prospects.',
      inputSchema: {
        websetId: z.string().min(3).describe('Exa Webset id returned by hermes.prospect_search.'),
        userId: z.string().optional().describe('Hermes user id for server-to-server MCP callers.')
      }
    },
    async args => {
      const run = await getRunByWebsetId({
        userId: args.userId,
        websetId: args.websetId,
        preferAdmin: Boolean(args.userId)
      })

      if (!run) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'run_not_found',
              websetId: args.websetId
            }, null, 2)
          }]
        }
      }

      const snapshot = await getRunSnapshot({
        userId: run.user_id,
        websetId: args.websetId,
        preferAdmin: Boolean(args.userId)
      })

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            run: snapshot.run,
            prospects: snapshot.prospects,
            summary: {
              websetId: args.websetId,
              status: snapshot.run?.status,
              totalFound: snapshot.prospects.length
            }
          }, null, 2)
        }]
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
