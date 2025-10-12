'use client'

import { ProspectSearchSection } from './prospect-search-section'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { VideoSearchSection } from './video-search-section'

interface ToolSectionProps {
  tool: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  addToolResult?: (params: { toolCallId: string; result: any }) => void
}

export function ToolSection({
  tool,
  isOpen,
  onOpenChange,
  addToolResult
}: ToolSectionProps) {
  // concise debug in dev only
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 [ToolSection] Processing tool:', tool.toolName, 'state:', tool.state)
  }
  
  // ask_question is rendered inline in chat; no special popup UI here.

  switch (tool.toolName) {
    case 'email_drafter':
      return (
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground mb-2">Email Drafter</div>
          {/* Inline renderer if model calls the tool with UI props */}
          {tool?.state === 'result' && tool?.result && (() => {
            try {
              const res = typeof tool.result === 'string' ? JSON.parse(tool.result) : tool.result
              if (res?.type === 'drafter_ui') {
                const props = res.props || {}
                
                // Inject prospects from sessionStorage if not provided
                if (!props.prospects || props.prospects.length === 0) {
                  try {
                    const storedProspects = sessionStorage.getItem('hermes-latest-prospects')
                    const storedSummary = sessionStorage.getItem('hermes-search-summary')
                    if (storedProspects) {
                      props.prospects = JSON.parse(storedProspects)
                    }
                    if (storedSummary && !props.searchSummary) {
                      props.searchSummary = JSON.parse(storedSummary)
                    }
                  } catch (e) {
                    console.warn('Failed to load prospects from storage:', e)
                  }
                }
                
                const { InteractiveEmailDrafter } = require('./interactive-email-drafter') as any
                const Comp = InteractiveEmailDrafter
                if (Comp) return <Comp {...props} />
              }
            } catch {}
            return null
          })()}
        </div>
      )
    case 'ask_question':
      // Render nothing; clarifying questions are asked inline in chat now
      return null
    case 'search':
      if (process.env.NODE_ENV !== 'production') console.log('🔧 [ToolSection] Rendering SearchSection')
      return (
        <SearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'videoSearch':
      if (process.env.NODE_ENV !== 'production') console.log('🔧 [ToolSection] Rendering VideoSearchSection')
      return (
        <VideoSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'retrieve':
      if (process.env.NODE_ENV !== 'production') console.log('🔧 [ToolSection] Rendering RetrieveSection')
      return (
        <RetrieveSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'prospect_search':
      if (process.env.NODE_ENV !== 'production') console.log('🔧 [ToolSection] Rendering ProspectSearchSection')
      return (
        <ProspectSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'scrape_site':
      if (process.env.NODE_ENV !== 'production') console.log('🔧 [ToolSection] Rendering ScrapeSection')

      // Parse the result to show key insights
      let siteData = null
      try {
        const result = typeof tool.result === 'string' ? JSON.parse(tool.result) : tool.result
        siteData = result?.siteData || result
      } catch {}

      return (
        <div className="rounded-lg border border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Site Analysis Complete</div>
              <div className="text-xs text-gray-600">
                {tool.state === 'call' ? 'Analyzing website...' : 'Extracted key business insights'}
              </div>
            </div>
            {tool.state === 'result' && (
              <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                ✓ Done
              </div>
            )}
          </div>

          {tool.state === 'result' && siteData && (
            <div className="space-y-3 text-sm">
              {siteData.companyName && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">Company:</span>
                  <span className="text-gray-700">{siteData.companyName}</span>
                </div>
              )}
              {siteData.valueProposition && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 flex-shrink-0">Value Prop:</span>
                  <span className="text-gray-700 leading-relaxed">{siteData.valueProposition}</span>
                </div>
              )}
              {siteData.targetAudience && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 flex-shrink-0">Target:</span>
                  <span className="text-gray-700">{siteData.targetAudience}</span>
                </div>
              )}
              {siteData.primaryOffering && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-700 flex-shrink-0">Offering:</span>
                  <span className="text-gray-700">{siteData.primaryOffering}</span>
                </div>
              )}
            </div>
          )}

          {tool.state === 'call' && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Analyzing website content...</span>
            </div>
          )}
        </div>
      )
    default:
      if (process.env.NODE_ENV !== 'production') console.log('❌ [ToolSection] No handler for tool:', tool.toolName)
      // Generic fallback renderer so the user sees what's happening for unknown tools
      const resultText = (() => {
        try {
          if (typeof (tool as any).result === 'string') return (tool as any).result
          if ((tool as any).result) return JSON.stringify((tool as any).result, null, 2)
        } catch {}
        return undefined
      })()
      return (
        <div className="rounded-md border p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-medium">{tool.toolName}</div>
            <div className="text-muted-foreground">{tool.state === 'call' ? 'Working…' : 'Done'}</div>
          </div>
          {resultText && (
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] opacity-90">
              {resultText}
            </pre>
          )}
        </div>
      )
  }
}
