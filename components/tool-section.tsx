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
                const Dr = require('./interactive-email-drafter') as any
                const Comp = Dr.InteractiveEmailDrafter
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
