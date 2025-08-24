'use client'

import type { ToolInvocation } from 'ai'
import { ProspectSearchSection } from './prospect-search-section'
import { QuestionConfirmation } from './question-confirmation'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { VideoSearchSection } from './video-search-section'

interface ToolSectionProps {
  tool: ToolInvocation
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
  console.log('🔧 [ToolSection] Processing tool:', tool.toolName, 'state:', tool.state)
  
  // Special handling for ask_question tool
  if (tool.toolName === 'ask_question') {
    console.log('🔧 [ToolSection] Processing ask_question tool')
    // When waiting for user input
    if (tool.state === 'call' && addToolResult) {
      return (
        <QuestionConfirmation
          toolInvocation={tool}
          onConfirm={(toolCallId, approved, response) => {
            addToolResult({
              toolCallId,
              result: approved
                ? response
                : {
                    declined: true,
                    skipped: response?.skipped,
                    message: 'User declined this question'
                  }
            })
          }}
        />
      )
    }

    // When result is available, display the result
    if (tool.state === 'result') {
      return (
        <QuestionConfirmation
          toolInvocation={tool}
          isCompleted={true}
          onConfirm={() => {}} // Not used in result display mode
        />
      )
    }
  }

  switch (tool.toolName) {
    case 'search':
      console.log('🔧 [ToolSection] Rendering SearchSection')
      return (
        <SearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'videoSearch':
      console.log('🔧 [ToolSection] Rendering VideoSearchSection')
      return (
        <VideoSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'retrieve':
      console.log('🔧 [ToolSection] Rendering RetrieveSection')
      return (
        <RetrieveSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'prospect_search':
      console.log('🔧 [ToolSection] Rendering ProspectSearchSection')
      return (
        <ProspectSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    default:
      console.log('❌ [ToolSection] No handler for tool:', tool.toolName)
      return null
  }
}
