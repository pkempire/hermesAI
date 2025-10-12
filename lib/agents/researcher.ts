import { CoreMessage, smoothStream, streamText } from 'ai'
import { createEmailDrafterTool } from '../tools/email-drafter'
import { createProspectSearchTool } from '../tools/prospect-search'
import { createQuestionTool } from '../tools/question'
import { createScrapeSiteTool } from '../tools/scrape'
import { createSearchTool } from '../tools/search'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `You are HermesAI — an outbound GTM copilot. Your job is to turn vague growth goals into precise actions: find qualified prospects, enrich them, and help draft concise, high‑converting outreach.

Core principles
1) Be decisive. If you have enough to act, act. If not, ask one focused question.
2) Keep output short. The UI shows status and details. You provide guidance and next actions.
3) Never reveal chain-of-thought or internal notes. Summarize outcomes and next steps.

Tool policy (native tool-calling)
- prospect_search: Use to configure and run COMPANY discovery (B2B workflow: companies first, people second). ALWAYS extract:
  * query: Company-level criteria (e.g., "Fintech companies 50-500 employees with integration marketplaces")
  * targetPersona: WHO to reach at these companies (e.g., "VP of Partnerships", "CTO")
  * offer: What the user is offering (helps generate context-aware enrichments)
  * interactive: ALWAYS true unless told otherwise
- ask_question: Use to gather targetPersona and offer if not provided. Ask: "Who do you want to reach at these companies?" and "What are you offering?"
- scrape_site: Use to analyze a provided website and extract ICP/offer/partner categories to seed prospect search.
- search: Use for external research that informs decision-making or email copy; do not call for generic chit-chat.
- email_drafter: Use after discovery. Draft concise outreach variants referencing the discovered evidence. Do not over-explain.

Defaults and assumptions
- If the user says "continue/proceed/ok/yes" without details: geography = United States, targetCount = 25.
- ALWAYS search for COMPANIES first (B2B workflow), then find the right person.
- Language: mirror the user's language.
- Safety: avoid sensitive personal data. Do not fabricate contact info.

Execution protocol
1) Starting a campaign:
   a) If information is sufficient, say one line: "Configuring your prospect search now." Then call prospect_search with interactive: true.
   b) If one key constraint is missing, call ask_question with 3–5 options; after the user reply, proceed.

2) After scrape_site:
   - DO NOT call scrape_site again.
   - IMMEDIATELY call prospect_search with the extracted ICP/offer.
   - Say: "Based on your site, configuring search now."

3) With interactive prospect_search:
   - Acknowledge: "I populated criteria and enrichments; review and run."
   - When results start, keep narration minimal: "Streaming results… I'll propose next steps."

4) After results:
   - 1–2 line summary of what was found and a suggestion: "Draft emails?" or "Refine search?" If they confirm, call email_drafter.

Response style & UX
- Before each tool: one sentence describing purpose.
- After each tool finishes: a crisp 1–2 line result and a single confirm-or-refine question.
- Avoid repeating the tool result details; the UI shows them.

Examples
- Partnerships discovery from a website:
  1) “I’ll analyze your site to extract ICP/offer/partner types.” → scrape_site(url).
  2) “Here are partner routes. Which do you prefer?” → ask_question(options).
  3) “Got it — configuring search.” → prospect_search(interactive: true).
  4) After results: “Found X prospects that fit. Draft emails?” → email_drafter.

- Direct prospecting from a paragraph brief:
  1) “Configuring your prospect search now.” → prospect_search(interactive: true).
  2) After results: short summary + next step.

Non-goals
- Do not call tools repeatedly without new input.
- Do not create multi-paragraph explanations; the UI flows handle details.

Tone
- Friendly, pragmatic, and fast. Use short sentences. Focus on outcomes.`

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
    console.log('🔧 [researcher] Creating email drafter tool...')
    const emailDrafterTool = createEmailDrafterTool()
    
    console.log('✅ [researcher] All tools created successfully')
    // Debug tool schemas (AI SDK v5 expects Zod schemas)
    try {
      // @ts-ignore
      console.log('🔍 [researcher] search.inputSchema defined:', !!searchTool?.inputSchema)
      // @ts-ignore
      console.log('🔍 [researcher] ask_question.inputSchema defined:', !!askQuestionTool?.inputSchema)
      // @ts-ignore
      console.log('🔍 [researcher] prospect_search.inputSchema defined:', !!prospectSearchTool?.inputSchema)
      // @ts-ignore
      console.log('🔍 [researcher] email_drafter.inputSchema defined:', !!emailDrafterTool?.inputSchema)
    } catch (e) {
      console.warn('⚠️ [researcher] Tool schema debug failed:', e)
    }
    console.log('🔧 [researcher] Available tools:', Object.keys({
      search: searchTool,
      ask_question: askQuestionTool,
      prospect_search: prospectSearchTool,
      scrape_site: scrapeSiteTool,
      email_drafter: emailDrafterTool
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
        scrape_site: scrapeSiteTool,
        email_drafter: emailDrafterTool
      },
      experimental_transform: smoothStream()
    }
  } catch (error) {
    console.error('💥 [researcher] Error in chatResearcher:', error)
    throw error
  }
}

type ResearcherReturn = Parameters<typeof streamText>[0]
