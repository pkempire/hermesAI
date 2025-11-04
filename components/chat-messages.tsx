'use client'

import { cn } from '@/lib/utils'
import { ChatRequestOptions, JSONValue, type UIMessage as Message } from 'ai'
import { useEffect, useMemo, useState } from 'react'
import { RenderMessage } from './render-message'
import { ToolSection } from './tool-section'
import { Spinner } from './ui/spinner'

// Import section structure interface
interface ChatSection {
  id: string
  userMessage: Message
  assistantMessages: Message[]
}

interface ChatMessagesProps {
  sections: ChatSection[] // Changed from messages to sections
  data: JSONValue[] | undefined
  onQuerySelect: (query: string) => void
  isLoading: boolean
  chatId?: string
  addToolResult?: (params: { toolCallId: string; result: any }) => void
  /** Ref for the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>
  reload?: (
    messageId: string,
    options?: ChatRequestOptions
  ) => Promise<string | null | undefined>
}

export function ChatMessages({
  sections,
  data,
  onQuerySelect,
  isLoading,
  chatId,
  addToolResult,
  scrollContainerRef,
  onUpdateMessage,
  reload
}: ChatMessagesProps) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})
  const manualToolCallId = 'manual-tool-call'

  useEffect(() => {
    // Open manual tool call when the last section is a user message
    if (sections.length === 0) return
    const lastSection = sections[sections.length - 1]
    if (lastSection.userMessage.role !== 'user') return
    setOpenStates(prev => {
      // Avoid resetting other open states on each render
      if (prev[manualToolCallId]) return prev
      return { ...prev, [manualToolCallId]: true }
    })
  }, [sections, manualToolCallId])

  // get last tool data for manual tool call
  const lastToolData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null

    // Find last tool_call item from the data stream
    const lastItem = [...data]
      .reverse()
      .find((d: any) => d && typeof d === 'object' && (d as any).type === 'tool_call') as {
      type: 'tool_call'
      data: {
        toolCallId: string
        state: 'call' | 'result'
        toolName: string
        args: string
      }
    } | undefined

    if (!lastItem || lastItem.type !== 'tool_call' || !lastItem.data) return null

    const toolData = lastItem.data
    return {
      state: 'call' as const,
      toolCallId: toolData.toolCallId,
      toolName: toolData.toolName,
      args: toolData.args ? JSON.parse(toolData.args) : undefined
    }
  }, [data])

  // Check if loading indicator should be shown (compute early to avoid conditional hooks)
  const showLoading =
    isLoading &&
    sections.length > 0 &&
    sections[sections.length - 1].assistantMessages.length === 0

  // Progressive loading steps while waiting for first assistant message
  const [loadingStep, setLoadingStep] = useState(0)
  useEffect(() => {
    if (!showLoading) return
    setLoadingStep(0)
    const id = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % 3)
    }, 1400)
    return () => clearInterval(id)
  }, [showLoading])

  if (!sections.length) return null

  // Get all messages as a flattened array
  const allMessages = sections.flatMap(section => [
    section.userMessage,
    ...section.assistantMessages
  ])

  const lastUserIndex =
    allMessages.length -
    1 -
    [...allMessages].reverse().findIndex(msg => msg.role === 'user')

  const getIsOpen = (id: string) => {
    if (id.includes('call')) {
      return openStates[id] ?? true
    }
    const baseId = id.endsWith('-related') ? id.slice(0, -8) : id
    const index = allMessages.findIndex(msg => msg.id === baseId)
    return openStates[id] ?? index >= lastUserIndex
  }

  const handleOpenChange = (id: string, open: boolean) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: open
    }))
  }

  return (
    <div
      id="scroll-container"
      ref={scrollContainerRef}
      role="list"
      aria-roledescription="chat messages"
      className={cn(
        'relative pt-2 md:pt-3 w-full h-full flex-1 overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'
      )}
    >
      <div className="relative mx-auto w-full max-w-3xl px-3 md:px-4 pb-24">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            className="chat-section mb-6 md:mb-7"
            style={
              sectionIndex === sections.length - 1
                ? { minHeight: '50vh' }
                : {}
            }
          >
            {/* User message */}
            <div className="flex flex-col gap-4 mb-4">
              <RenderMessage
                message={section.userMessage}
                messageId={section.userMessage.id}
                getIsOpen={getIsOpen}
                onOpenChange={handleOpenChange}
                onQuerySelect={onQuerySelect}
                chatId={chatId}
                addToolResult={addToolResult}
                onUpdateMessage={onUpdateMessage}
                reload={reload}
              />
              {showLoading && <Spinner />}
            </div>

            {/* Assistant messages */}
            {section.assistantMessages.map((assistantMessage, idx) => (
              <div key={`${assistantMessage.id}-${idx}`} className="flex flex-col gap-4">
                <RenderMessage
                  message={assistantMessage}
                  messageId={assistantMessage.id}
                  getIsOpen={getIsOpen}
                  onOpenChange={handleOpenChange}
                  onQuerySelect={onQuerySelect}
                  chatId={chatId}
                  addToolResult={addToolResult}
                  onUpdateMessage={onUpdateMessage}
                  reload={reload}
                />
              </div>
            ))}
          </div>
        ))}

        {showLoading && lastToolData && (
          <ToolSection
            key={manualToolCallId}
            tool={lastToolData}
            isOpen={getIsOpen(manualToolCallId)}
            onOpenChange={open => handleOpenChange(manualToolCallId, open)}
            addToolResult={addToolResult}
          />
        )}
      </div>
    </div>
  )
}
