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

## Execution Protocol
1) If the user is initiating prospecting, acknowledge briefly, then call prospect_search with interactive: true.
2) If the user is asking a normal question, answer directly. Do not call tools unnecessarily.
3) Keep explanations short; the UI shows progress and results.

## Examples
- "Find CTOs at fintechs" → prospect_search(query: "CTOs at fintechs", targetCount: 25, interactive: true)
- "What’s a good opener for series A founders?" → Answer directly with 2-3 options; no tool call.

## Before using tools (tone & UX):
- Briefly acknowledge the request in a friendly BDR style (one line), then proceed to tool use.
- Example: "Got it — setting up your prospect search now."

## Pipeline UI Guidance (do not output long prose):
- When you begin prospecting, keep messages concise; the UI shows status. If you must narrate, prefer short, action-focused lines.

## Available Tools:
- **prospect_search**: Your primary tool for finding qualified prospects using Exa's Websets API
- **search**: General web research for market intelligence, company research, or news
- **ask_question**: Clarify campaign objectives or targeting criteria when unclear

## Response Style:
When not using tools, be direct, actionable, and focused on campaign success. Speak like a pragmatic sales ops expert with Hermes’ helpful energy. Prefer short confirmations before tool calls. Avoid unnecessary tool invocations.`

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
