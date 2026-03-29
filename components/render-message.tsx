import { ChatRequestOptions, JSONValue, type UIMessage as Message } from 'ai'
import { useMemo } from 'react'
import { AnswerSection } from './answer-section'
import RelatedQuestions from './related-questions'
import { ToolSection } from './tool-section'
import { UserMessage } from './user-message'

interface RenderMessageProps {
  message: Message
  messageId: string
  getIsOpen: (id: string) => boolean
  onOpenChange: (id: string, open: boolean) => void
  onQuerySelect: (query: string) => void
  chatId?: string
  addToolResult?: (params: { toolCallId: string; result: any }) => void
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>
  reload?: (
    messageId: string,
    options?: ChatRequestOptions
  ) => Promise<string | null | undefined>
}

export function RenderMessage({
  message,
  messageId,
  getIsOpen,
  onOpenChange,
  onQuerySelect,
  chatId,
  addToolResult,
  onUpdateMessage,
  reload
}: RenderMessageProps) {
  const messageAnnotations = (message as any)?.annotations
  const relatedQuestions = useMemo(() => {
    const annotations = messageAnnotations as any[] | undefined
    return annotations?.filter(a => a?.type === 'related-questions')
  }, [messageAnnotations])

  // Tool calls and results are now handled directly from message.parts
  // No need to parse from annotations or metadata
  // Legacy toolData removed - using native AI SDK parts instead

  // Extract the unified reasoning annotation directly.
  const reasoningAnnotation = null

  // Extract the reasoning time and reasoning content from the annotation.
  // If annotation.data is an object, use its fields. Otherwise, default to a time of 0.
  const reasoningTime = 0

  const getTextFromMessage = (m: any): string => {
    if (Array.isArray(m?.parts)) {
      return m.parts
        .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('')
    }
    return typeof m?.content === 'string' ? m.content : ''
  }

  const normalizedParts = useMemo(() => {
    if (Array.isArray((message as any)?.parts) && (message as any).parts.length > 0) {
      return (message as any).parts as any[]
    }

    if (Array.isArray((message as any)?.content) && (message as any).content.length > 0) {
      return (message as any).content as any[]
    }

    const fallbackParts: any[] = []

    if (typeof (message as any)?.content === 'string' && (message as any).content.length > 0) {
      fallbackParts.push({ type: 'text', text: (message as any).content })
    }

    if (Array.isArray((message as any)?.toolInvocations)) {
      for (const invocation of (message as any).toolInvocations) {
        if (invocation?.state === 'result') {
          fallbackParts.push({
            type: 'tool-result',
            toolCallId: invocation.toolCallId,
            toolName: invocation.toolName,
            output: invocation.result
          })
        } else if (invocation?.toolCallId && invocation?.toolName) {
          fallbackParts.push({
            type: 'tool-call',
            toolCallId: invocation.toolCallId,
            toolName: invocation.toolName,
            args: invocation.args
          })
        }
      }
    }

    return fallbackParts
  }, [message])

  if (message.role === 'user') {
    return (
      <UserMessage
        message={getTextFromMessage(message as any)}
        messageId={messageId}
        onUpdateMessage={onUpdateMessage}
      />
    )
  }

  // New way: Use parts instead of toolInvocations
  return (
    <>
      {/* Tool calls/results are now rendered from message.parts below */}
      {normalizedParts.map((part, index) => {
        // Check if this is the last part in the array
        const isLastPart = index === normalizedParts.length - 1

        if (
          typeof part?.type === 'string' &&
          part.type.startsWith('tool-') &&
          part.type !== 'tool-call' &&
          part.type !== 'tool-result' &&
          part.type !== 'tool-invocation'
        ) {
          const toolName = part.type.replace(/^tool-/, '')
          const tool: any =
            part.state === 'output-available'
              ? {
                  state: 'result',
                  toolCallId: part.toolCallId,
                  toolName,
                  result: part.output
                }
              : part.state === 'output-error'
              ? {
                  state: 'result',
                  toolCallId: part.toolCallId,
                  toolName,
                  result: {
                    type: 'prospect_search_error',
                    message: part.errorText || 'Tool execution failed'
                  }
                }
              : {
                  state: 'call',
                  toolCallId: part.toolCallId,
                  toolName,
                  args: part.input
                }

          return (
            <ToolSection
              key={`${messageId}-typedtool-${index}`}
              tool={tool}
              isOpen={getIsOpen(tool.toolCallId)}
              onOpenChange={open => onOpenChange(tool.toolCallId, open)}
              addToolResult={addToolResult}
            />
          )
        }

        switch (part.type) {
          case 'tool-invocation':
            return (
              <ToolSection
                key={`${messageId}-tool-${index}`}
                tool={(part as any).toolInvocation as any}
                isOpen={getIsOpen((part as any).toolInvocation.toolCallId)}
                onOpenChange={open =>
                  onOpenChange((part as any).toolInvocation.toolCallId, open)
                }
                addToolResult={addToolResult}
              />
            )
          case 'tool-call': {
            const tool: any = {
              state: 'call',
              toolCallId: (part as any).toolCallId,
              toolName: (part as any).toolName,
              args: (part as any).args
            } as any
            return (
              <ToolSection
                key={`${messageId}-toolcall-${index}`}
                tool={tool}
                isOpen={getIsOpen(tool.toolCallId)}
                onOpenChange={open => onOpenChange(tool.toolCallId, open)}
                addToolResult={addToolResult}
              />
            )
          }
          case 'tool-result': {
            // Output is already structured, no need to parse
            const output = (part as any).output
            // Handle both string JSON and object formats
            let parsedResult = output
            if (typeof output === 'string') {
              try {
                parsedResult = JSON.parse(output)
              } catch {
                parsedResult = output
              }
            }
            
            const tool: any = {
              state: 'result',
              toolCallId: (part as any).toolCallId,
              toolName: (part as any).toolName,
              result: parsedResult  // Use parsed result
            } as any
            
            return (
              <ToolSection
                key={`${messageId}-toolresult-${index}`}
                tool={tool}
                isOpen={getIsOpen(tool.toolCallId)}
                onOpenChange={open => onOpenChange(tool.toolCallId, open)}
                addToolResult={addToolResult}
              />
            )
          }
          case 'text':
            // Only show actions if this is the last part and it's a text part
            return (
              <AnswerSection
                key={`${messageId}-text-${index}`}
                content={(part as any).text}
                isOpen={getIsOpen(messageId)}
                onOpenChange={open => onOpenChange(messageId, open)}
                chatId={chatId}
                showActions={isLastPart}
                messageId={messageId}
                reload={reload}
              />
            )
          // Add other part types as needed
          default:
            return null
        }
      })}
      {relatedQuestions && relatedQuestions.length > 0 && (
        <RelatedQuestions
          annotations={relatedQuestions as JSONValue[]}
          onQuerySelect={onQuerySelect}
          isOpen={getIsOpen(`${messageId}-related`)}
          onOpenChange={open => onOpenChange(`${messageId}-related`, open)}
        />
      )}
    </>
  )
}
