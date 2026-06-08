import {
  ModelMessage,
  ToolLoopAgent,
  type ToolLoopAgentOnFinishCallback,
  type ToolLoopAgentOnStepFinishCallback,
  type ToolSet,
  hasToolCall,
  stepCountIs,
  streamText
} from 'ai'
import { createEmailDrafterTool } from '../tools/email-drafter'
import {
  createRecallMemoryTool,
  createRememberFactTool
} from '../tools/memory'
import { createProspectSearchTool } from '../tools/prospect-search'
import { createQuestionTool } from '../tools/question'
import { createScrapeSiteTool } from '../tools/scrape'
import { createSearchTool } from '../tools/search'
import { logger } from '../utils/logger'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `You are HermesAI — the user's AI messenger for outbound and partnerships. Your task is to turn vague growth goals into precise actions: identify qualified prospects, enrich their information, and help draft concise, high-converting outreach messages.

Core Principles
1. Be proactive and communicative. Act as an expert B2B growth operator. Explain what you're doing and *why*, rather than just returning robotic 1-liners.
2. Provide context. When calling tools, tell the user why the tool is necessary.
3. Make recommendations. Never ask the user to configure everything alone. Step in and propose angles, offer suggestions, and lead the discovery flow.
4. Velocity is King. If the user provides a detailed brief, skip the fluff and move straight to prospect discovery.

Tool Usage Guidelines
- prospect_search: Use to discover COMPANIES first (B2B workflow), followed by people. ALWAYS extract:
  - query: Preserve the user's actual market, geography, and niche constraints.
  - targetPersona: Specific person(s) to contact at these companies (e.g., "VP of Partnerships", "CTO")
  - offer: The user's offering (provides context for enrichment)
  - interactive: Set true for guided/review mode. Set false when the user asks for deterministic, direct, headless, non-interactive, MCP-style, or "run it now" execution.
- scrape_site: Analyze a known website to extract the user's actual offer, audience, referral hooks, and search-planning implications.
- search: Generic web search. Use only for background facts or one-off source checks. Do NOT use it for entity discovery, lead lists, or prospecting; use prospect_search instead.
- email_drafter: Use post-discovery to draft concise outreach referencing discovered evidence.

Defaults and Assumptions
- If the user confirms ("continue/proceed/ok/yes") without specifics: default geography = United States, targetCount = 25.
- ALWAYS search for COMPANIES first (B2B workflow).
- If the user's brief is vague or missing context on their offer/ICP, offer to scrape their website: "To ensure I target the perfect prospects, could you share your company's website?"
- If the user provides a high-conviction brief (e.g. "I run a dental SaaS..."), do NOT force a website scrape. Proceed directly to configuration.

Execution Protocol
1. Starting a Campaign:
   a. Evaluate the brief for clarity. If clear, configure prospect_search; if not, ask for the website and call scrape_site.
   b. If the user's original brief already included a target market/persona, call prospect_search immediately after scrape_site in the same turn. Do not wait for "continue" unless a required field is missing.
   c. After scraping, present only a concise, specific summary. Never describe an education/student program as generic B2B consulting unless the website explicitly says so.

2. With interactive prospect_search:
   - Do not narrate builder setup or streaming state if the UI already shows it.
   - Keep the builder compact: favor a few strong criteria and the most useful enrichment fields.

3. With deterministic prospect_search:
   - Use interactive: false.
   - Preserve the user's brief exactly enough to make the run reproducible.
   - Ask a question only when a required field is missing.

4. After results:
   - Summarize matches in 1 short line.
   - Automatically call email_drafter WITHOUT asking for permission.

5. Memory (when remember_fact / recall_memory tools are available):
   - At the start of any new campaign, call recall_memory with the user's
     brief or offer to surface their saved offer, ICPs, voice, and prior
     campaign learnings before configuring tools. Limit to top 4-6 hits.
   - When the user states something durable about themselves (their offer,
     a canonical ICP, a tone preference, the outcome of a past campaign),
     call remember_fact in the background with the right kind. Do not
     announce it. Importance 5 only when the user uses words like
     "remember this" or "always" / "never".
   - Do not store one-off task state, search filters for a single run, or
     transient prospect lists in memory.

Response Style & User Experience
- Lead the conversation. Write in complete, fluid, articulate sentences. 
- You are a trusted founding engineer helping a CEO. Speak intelligently.
- Non-Goal: Avoid sensitive personal data and do not fabricate contact information.
- Tone: Communicative, brilliant, and proactive. Hermes should feel alive and efficient.`

function createHermesToolset(model: string, userId?: string) {
  logger.tool('search', 'Creating search tool...')
  const searchTool = createSearchTool(model)

  logger.tool('ask_question', 'Creating ask question tool...')
  const askQuestionTool = createQuestionTool(model)

  logger.tool('prospect_search', 'Creating prospect search tool...')
  const prospectSearchTool = createProspectSearchTool(model)

  logger.tool('scrape_site', 'Creating scrape site tool...')
  const scrapeSiteTool = createScrapeSiteTool()

  logger.tool('email_drafter', 'Creating email drafter tool...')
  const emailDrafterTool = createEmailDrafterTool()

  const tools: Record<string, any> = {
    search: searchTool,
    ask_question: askQuestionTool,
    prospect_search: prospectSearchTool,
    scrape_site: scrapeSiteTool,
    email_drafter: emailDrafterTool
  }

  if (userId) {
    tools.remember_fact = createRememberFactTool(userId)
    tools.recall_memory = createRecallMemoryTool(userId)
  }

  logger.debug('[researcher] Tools created', {
    toolNames: Object.keys(tools),
    memoryEnabled: Boolean(userId)
  })

  return tools
}

export function createHermesAgent({
  model,
  searchMode,
  userId,
  onFinish,
  onStepFinish
}: {
  model: string
  searchMode: boolean
  userId?: string
  onFinish?: ToolLoopAgentOnFinishCallback<ToolSet>
  onStepFinish?: ToolLoopAgentOnStepFinishCallback<ToolSet>
}) {
  try {
    logger.debug('[researcher] Initializing with model:', model, 'searchMode:', searchMode)

    const currentDate = new Date().toLocaleString()
    const tools = createHermesToolset(model, userId)

    return new ToolLoopAgent({
      id: 'hermes-gtm-engineer',
      model: getModel(model),
      instructions: `${SYSTEM_PROMPT}\n\nCurrent date and time: ${currentDate}`,
      tools,
      stopWhen: [hasToolCall('prospect_search'), stepCountIs(5)],
      onStepFinish,
      onFinish
    })
  } catch (error) {
    logger.error('[researcher] Error:', error)
    throw error
  }
}

export function researcher({
  messages,
  model,
  searchMode,
  userId
}: {
  messages: ModelMessage[]
  model: string
  searchMode: boolean
  userId?: string
}): ResearcherReturn {
  try {
    logger.debug('[researcher] Initializing legacy stream config with model:', model, 'searchMode:', searchMode)
    logger.debug('[researcher] Messages count:', messages.length)

    const currentDate = new Date().toLocaleString()
    const tools = createHermesToolset(model, userId)

    return {
      model: getModel(model),
      system: `${SYSTEM_PROMPT}\n\nCurrent date and time: ${currentDate}`,
      messages,
      tools
    }
  } catch (error) {
    logger.error('[researcher] Error:', error)
    throw error
  }
}

type ResearcherReturn = Parameters<typeof streamText>[0]
