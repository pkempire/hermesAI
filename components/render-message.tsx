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
  const relatedQuestions = useMemo(() => {
    const annotations = (message as any)?.annotations as any[] | undefined
    return annotations?.filter(a => a?.type === 'related-questions')
  }, [(message as any)?.annotations])

  // Render for manual tool call
  const toolData = useMemo(() => {
    const collected: any[] = []
    // 1) From annotations (legacy path)
    const annotations = ((message as any)?.annotations as any[] | undefined) || []
    for (const ann of annotations) {
      if (ann?.type === 'tool_call' && ann?.data) collected.push(ann.data)
    }
    // 2) From message.metadata (v5 message-metadata path)
    const meta = (message as any)?.metadata
    if (meta) {
      if (Array.isArray(meta)) {
        for (const m of meta) if (m?.type === 'tool_call' && m?.data) collected.push(m.data)
      } else if (meta?.type === 'tool_call' && meta?.data) {
        collected.push(meta.data)
      }
    }

    const map = new Map<string, any>()
    for (const raw of collected) {
      const data = raw || {}
      const existing = map.get(data.toolCallId)
      if (!existing || data.state === 'result') {
        map.set(data.toolCallId, {
          ...data,
          args: data.args ? JSON.parse(data.args) : {},
          result:
            data.result && data.result !== 'undefined'
              ? JSON.parse(data.result)
              : undefined
        } as any)
      }
    }
    return Array.from(map.values())
  }, [(message as any)?.annotations, (message as any)?.metadata])

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
      {toolData.map(tool => (
        <ToolSection
          key={tool.toolCallId}
          tool={tool}
          isOpen={getIsOpen(tool.toolCallId)}
          onOpenChange={open => onOpenChange(tool.toolCallId, open)}
          addToolResult={addToolResult}
        />
      ))}
      {message.parts?.map((part, index) => {
        // Check if this is the last part in the array
        const isLastPart = index === (message.parts?.length ?? 0) - 1

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
            const output = (part as any).output
            let result: any = undefined
            try {
              if (output?.type === 'json') {
                result = JSON.stringify(output.value)
              } else if (output?.type === 'text') {
                result = output.value
              } else if (output) {
                result = JSON.stringify(output)
              }
            } catch {
              result = undefined
            }
            const tool: any = {
              state: 'result',
              toolCallId: (part as any).toolCallId,
              toolName: (part as any).toolName,
              result
            } as any
            return (
              <ToolSection
                key={`${messageId}-toolresult-${index}`}
                tool={tool}
                isOpen={getIsOpen(tool.toolCallId)}
                onOpenChange={open => onOpenChange(tool.toolCallId, open)}
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
