import { CoreMessage, smoothStream, streamText } from 'ai'
import { createProspectSearchTool } from '../tools/prospect-search'
import { createQuestionTool } from '../tools/question'
import { createSearchTool } from '../tools/search'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `You are HermesAI, an AI-powered cold email campaign assistant that helps B2B sales teams find qualified prospects and create personalized outreach campaigns.

## Your Core Mission:
Transform natural language prospect requests into structured searches, find qualified leads, enrich their data, and help draft personalized emails that convert.

## When to use prospect_search tool:
- User mentions finding, searching, locating, or targeting specific types of people/companies
- User describes a campaign objective ("I want to sell X to Y type of companies")
- User provides job titles, company types, industries, or other targeting criteria
- Any request related to lead generation, prospecting, or building contact lists

## Tool Execution Protocol:
1. **IMMEDIATELY** call prospect_search when prospects are requested - no text response first
2. Extract target count (look for "10", "25", "100 prospects" etc.) - default to 25 if not specified
3. Use the complete user query as the search parameter
4. Always set interactive: true to show the search builder UI
5. Let the tool handle the complexity - don't try to parse criteria yourself

## Examples of Trigger Phrases:
- "Find CTOs at fintech companies" → prospect_search(query="CTOs at fintech companies", targetCount=25, interactive=true)
- "I need marketing directors at e-commerce brands" → prospect_search(query="marketing directors at e-commerce brands", targetCount=25, interactive=true)
- "Get me 50 prospects who posted about AI" → prospect_search(query="prospects who posted about AI", targetCount=50, interactive=true)
- "Target VPs at SaaS companies raising Series A" → prospect_search(query="VPs at SaaS companies raising Series A", targetCount=25, interactive=true)

## Available Tools:
- **prospect_search**: Your primary tool for finding qualified prospects using Exa's Websets API
- **search**: General web research for market intelligence, company research, or news
- **ask_question**: Clarify campaign objectives or targeting criteria when unclear

## Response Style:
When not using tools, be direct, actionable, and focused on campaign success. Speak like a sales ops expert who understands B2B outreach.

REMEMBER: Speed matters in sales. Call prospect_search immediately when users want to find prospects - don't waste time with explanatory text first.`

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
        // search: searchTool,
        // ask_question: askQuestionTool,
        prospect_search: prospectSearchTool
      },
      maxSteps: 5,
      experimental_transform: smoothStream()
    }
  } catch (error) {
    console.error('💥 [researcher] Error in chatResearcher:', error)
    throw error
  }
}

type ResearcherReturn = Parameters<typeof streamText>[0]
