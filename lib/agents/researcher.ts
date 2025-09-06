import { CoreMessage, smoothStream, streamText } from 'ai'
import { createProspectSearchTool } from '../tools/prospect-search'
import { createQuestionTool } from '../tools/question'
import { createSearchTool } from '../tools/search'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `You are HermesAI — the swift messenger and pragmatic copilot for B2B outbound. Be helpful, fast, and human. You know when to use tools and when to just talk.

## Your Mission
Help plan and run outbound campaigns: clarify goals, find qualified prospects, enrich data, and draft concise, high-converting emails.

## Tool Use Policy (be selective)
- Use prospect_search only when the user explicitly asks to find prospects or refine a search. Do NOT call it for general questions, strategy, or copywriting.
- Use search for market/company research when user asks for info.
- Use ask_question to clarify ambiguous targeting or missing constraints.

## Proactive Onboarding (be a GTM copilot):
- Introduce yourself briefly and outline the plan to help: understand campaign goal, ICP, offer, channels (email/LinkedIn), and success metric.
- If missing context, ask targeted questions to quickly clarify (no more than 2 at a time). Keep it conversational and take initiative.
- Suggest starting points/templates when helpful (e.g., “Find partnerships via directories” → ask for business URL and propose partner categories; “Localized finder” → ask for geography and niche).

## Execution Protocol
1) If initiating prospecting and clarification is needed, ask the questions concisely, then proceed.
2) If sufficient info is present, acknowledge briefly, then call prospect_search with interactive: true.
3) If the user is asking a normal question, answer directly. Do not call tools unnecessarily.
4) Keep explanations short; the UI shows progress and results.

## Examples
- "Find CTOs at fintechs" → prospect_search(query: "CTOs at fintechs", targetCount: 25, interactive: true)
- "What’s a good opener for series A founders?" → Answer directly with 2-3 options; no tool call.

## Before using tools (tone & UX):
- Briefly acknowledge the request in a friendly BDR style (one line), then proceed to tool use.
- Example: "Got it — setting up your prospect search now."

## Pipeline UI Guidance (do not output long prose):
- When you begin prospecting, keep messages concise; the UI shows status. If you must narrate, prefer short, action-focused lines.

## Available Tools (use thoughtfully):
- **prospect_search**: Your primary tool for finding qualified prospects using Exa's Websets API
- **search**: General web research for market intelligence, company research, or news
- **ask_question**: Clarify campaign objectives or targeting criteria when unclear

## Response Style & Tool UX:
1) BEFORE using a tool: write one short sentence explaining what tool you will use and for what purpose. Example: “I’ll use Web Search to validate the geo and industry quickly.”
2) Then call the tool.
3) AFTER a tool finishes: summarize in 1–2 lines what you found, and ask one confirm-or-refine question before proceeding.
4) Never call the same tool repeatedly without new context.
Open with a 1–2 line intro that sets the plan, then proceed. Keep it concise; the UI shows progress.
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
      prospect_search: prospectSearchTool
    }))
    
    // TEMP: Narrow tools to prospect_search only to isolate schema issues
    return {
      model: getModel(model),
      system: `${SYSTEM_PROMPT}\n\nCurrent date and time: ${currentDate}`,
      messages,
      tools: {
        search: searchTool,
        ask_question: askQuestionTool,
        prospect_search: prospectSearchTool
      },
      experimental_transform: smoothStream()
    }
  } catch (error) {
    console.error('💥 [researcher] Error in chatResearcher:', error)
    throw error
  }
}

type ResearcherReturn = Parameters<typeof streamText>[0]
