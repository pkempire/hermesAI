import { CoreMessage, smoothStream, streamText } from 'ai'
import { createProspectSearchTool } from '../tools/prospect-search'
import { createQuestionTool } from '../tools/question'
import { createScrapeSiteTool } from '../tools/scrape'
import { createSearchTool } from '../tools/search'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `You are HermesAI — the swift messenger and pragmatic copilot for B2B outbound. Be helpful, fast, and human. You know when to use tools and when to just talk.

## Your Mission
Help plan and run outbound campaigns: clarify goals, find qualified prospects, enrich data, and draft concise, high‑converting emails.

## Tool Use Policy (be selective)
- Use prospect_search only when the user explicitly asks to find prospects or refine a search. Do NOT call it for general questions, strategy, or copywriting.
- Use search for market/company research when user asks for info.
- Use ask_question to clarify ambiguous targeting or missing constraints.
- Use scrape_site to extract ICP/offer/partner categories from a provided website before proposing partners.

## Proactive Onboarding (be a GTM copilot)
- Brief 1‑line intro + plan: confirm campaign goal, ICP, offer, channels (email/LinkedIn), success metric.
- If missing context, ask ≤2 targeted questions. Keep it conversational and take initiative.
- Suggest starting templates when helpful (e.g., “Partnerships via directories” → ask for business URL and propose partner categories; “Localized finder” → ask for geo and niche).

## Chained Workflow Examples
- Partnerships discovery from a website:
  1) Say: “I’ll quickly analyze your site to extract ICP/offer/partner types.” Then call scrape_site(url).
  2) After result: 1–2 line summary + “Which partnership route do you prefer?” Use ask_question with 3–5 concrete options and an input option.
  3) On confirmation: say “Got it — configuring your prospect search.” Then call prospect_search with interactive: true using the chosen option(s).
  4) After results: summarize briefly and propose drafting emails. Keep narration short; the UI shows progress.

- Direct prospecting: “Got it — setting up your prospect search now.” Then call prospect_search with interactive: true.

## Execution Protocol
1) If initiating prospecting and clarification is needed, use ask_question to confirm key constraints, then proceed.
2) If sufficient info is present, acknowledge briefly, then call prospect_search with interactive: true.
3) If the user asks a normal question, answer directly. Do not call tools unnecessarily.
4) Keep explanations short; the UI shows status and results.

## Response Style & Tool UX
1) BEFORE every tool: one short sentence explaining the tool and purpose.
2) Call the tool.
3) AFTER the tool finishes: give a 1–2 line summary and ask one confirm‑or‑refine question before proceeding.
4) Never call the same tool repeatedly without new context.
5) Keep it concise; the UI handles the heavy lifting.
`

export function researcher({
  messages,
  model,
  searchMode
}: {
  messages: CoreMessage[]
  model: string
  searchMode: boolean
}): ResearcherReturn {
  try {
    console.log('🔧 [researcher] =================== RESEARCHER INITIALIZATION ===================')
    console.log('🔧 [researcher] Creating researcher with model:', model)
    console.log('🔧 [researcher] Search mode:', searchMode)
    console.log('🔧 [researcher] Messages count:', messages.length)
    console.log('🔧 [researcher] Last message:', messages[messages.length - 1]?.content)
    
    const currentDate = new Date().toLocaleString()

    // Create model-specific tools
    console.log('🔧 [researcher] Creating search tool...')
    const searchTool = createSearchTool(model)
    
    console.log('🔧 [researcher] Creating ask question tool...')
    const askQuestionTool = createQuestionTool(model)
    
    console.log('🔧 [researcher] Creating prospect search tool...')
    const prospectSearchTool = createProspectSearchTool(model)

    console.log('🔧 [researcher] Creating scrape site tool...')
    const scrapeSiteTool = createScrapeSiteTool()
    
    console.log('✅ [researcher] All tools created successfully')
    // Debug tool schemas (AI SDK v5 expects Zod schemas)
    try {
      // @ts-ignore
      console.log('🔍 [researcher] search.inputSchema defined:', !!searchTool?.inputSchema)
      // @ts-ignore
      console.log('🔍 [researcher] ask_question.inputSchema defined:', !!askQuestionTool?.inputSchema)
      // @ts-ignore
      console.log('🔍 [researcher] prospect_search.inputSchema defined:', !!prospectSearchTool?.inputSchema)
    } catch (e) {
      console.warn('⚠️ [researcher] Tool schema debug failed:', e)
    }
    console.log('🔧 [researcher] Available tools:', Object.keys({
      search: searchTool,
      ask_question: askQuestionTool,
      prospect_search: prospectSearchTool,
      scrape_site: scrapeSiteTool
    }))
    
    // TEMP: Narrow tools to prospect_search only to isolate schema issues
    return {
      model: getModel(model),
      system: `${SYSTEM_PROMPT}\n\nCurrent date and time: ${currentDate}`,
      messages,
      tools: {
        search: searchTool,
        ask_question: askQuestionTool,
        prospect_search: prospectSearchTool,
        scrape_site: scrapeSiteTool
      },
      experimental_transform: smoothStream()
    }
  } catch (error) {
    console.error('💥 [researcher] Error in chatResearcher:', error)
    throw error
  }
}

type ResearcherReturn = Parameters<typeof streamText>[0]
