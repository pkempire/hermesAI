import { type Model } from '@/lib/types/models'
import {
  CoreMessage,
  CoreToolMessage,
  generateId,
  JSONValue,
  type UIMessage as Message
} from 'ai'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ExtendedCoreMessage } from '../types'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Takes an array of AIMessage and modifies each message where the role is 'tool'.
 * Changes the role to 'assistant' and converts the content to a JSON string.
 * Returns the modified messages as an array of CoreMessage.
 *
 * @param aiMessages - Array of AIMessage
 * @returns modifiedMessages - Array of modified messages
 */
export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map(message =>
    message.role === 'tool'
      ? {
          ...message,
          role: 'assistant',
          content: JSON.stringify(message.content),
          type: 'tool'
        }
      : message
  ) as CoreMessage[]
}

/**
 * Sanitizes a URL by replacing spaces with '%20'
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20')
}

export function createModelId(model: Model): string {
  return `${model.providerId}:${model.id}`
}

export function getDefaultModelId(models: Model[]): string {
  if (!models.length) {
    throw new Error('No models available')
  }
  return createModelId(models[0])
}

export function getMonthlyPlanForCount(count: number): { plan: 'starter' | 'pro' | 'enterprise'; price: number; quota: number } {
  if (count <= 200) return { plan: 'starter', price: 39, quota: 200 }
  if (count <= 2000) return { plan: 'pro', price: 200, quota: 2000 }
  return { plan: 'enterprise', price: 0, quota: Number.POSITIVE_INFINITY }
}

export function getStripeCheckoutUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ||
    'https://buy.stripe.com/cNi00i7UMc0xgLCfk56sw03'
  )
}

function addToolMessageToChat({
  toolMessage,
  messages
}: {
  toolMessage: CoreToolMessage
  messages: Array<Message>
}): Array<Message> {
  return messages.map(message => {
    if ((message as any).toolInvocations) {
      const existingParts = Array.isArray((message as any).parts)
        ? ([...(message as any).parts] as any[])
        : []

      for (const toolResult of toolMessage.content) {
        const alreadyRendered = existingParts.some(
          part =>
            part?.type === 'tool-result' &&
            part?.toolCallId === (toolResult as any).toolCallId
        )

        if (!alreadyRendered) {
          existingParts.push({
            type: 'tool-result',
            toolCallId: (toolResult as any).toolCallId,
            toolName: (toolResult as any).toolName,
            output: (toolResult as any).output ?? (toolResult as any).result
          })
        }
      }

      return {
        ...message,
        parts: existingParts,
        toolInvocations: (message as any).toolInvocations.map((toolInvocation: any) => {
          const toolResult = toolMessage.content.find(
            tool => tool.toolCallId === toolInvocation.toolCallId
          )

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: (toolResult as any).output ?? (toolResult as any).result
            }
          }

          return toolInvocation
        })
      } as any
    }

    return message
  })
}

export function convertToUIMessages(
  messages: Array<ExtendedCoreMessage>
): Array<Message> {
  let pendingAnnotations: JSONValue[] = []
  let pendingReasoning: string | undefined = undefined
  let pendingReasoningTime: number | undefined = undefined

  return messages.reduce((chatMessages: Array<Message>, message) => {
    // Handle tool messages
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages
      })
    }

    // Data messages are used to capture annotations, including reasoning.
    if (message.role === 'data') {
      if (
        message.content !== null &&
        message.content !== undefined &&
        typeof message.content !== 'string'
      ) {
        const content = message.content as JSONValue
        if (
          content &&
          typeof content === 'object' &&
          'type' in content &&
          'data' in content
        ) {
          if (content.type === 'reasoning') {
            // If content.data is an object, capture its reasoning and time;
            // otherwise treat it as a simple string.
            if (typeof content.data === 'object' && content.data !== null) {
              pendingReasoning = (content.data as any).reasoning
              pendingReasoningTime = (content.data as any).time
            } else {
              pendingReasoning = content.data as string
              pendingReasoningTime = 0
            }
          } else {
            pendingAnnotations.push(content)
          }
        }
      }
      return chatMessages
    }

    // Build the text content and tool invocations from message.content.
    let textContent = ''
    let toolInvocations: Array<any> = []
    let parts: Array<any> = []

    if (message.content) {
      if (typeof message.content === 'string') {
        textContent = message.content
        if (message.content.length > 0) {
          parts.push({ type: 'text', text: message.content })
        }
      } else if (Array.isArray(message.content)) {
        for (const content of message.content) {
          if (content && typeof content === 'object' && 'type' in content) {
            if (content.type === 'text' && 'text' in content) {
              textContent += (content as any).text
              parts.push({ type: 'text', text: (content as any).text })
            } else if (
              content.type === 'tool-call' &&
              'toolCallId' in content &&
              'toolName' in content &&
              'args' in content
            ) {
              const toolCall = {
                type: 'tool-call',
                toolCallId: (content as any).toolCallId,
                toolName: (content as any).toolName,
                args: (content as any).args
              }
              toolInvocations.push({
                state: 'call',
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args
              })
              parts.push(toolCall)
            }
          }
        }
      }
    }

    // For assistant messages, assemble annotations from any stashed data.
    let annotations: JSONValue[] | undefined = undefined
    if (message.role === 'assistant') {
      if (pendingAnnotations.length > 0 || pendingReasoning !== undefined) {
        annotations = [
          ...pendingAnnotations,
          ...(pendingReasoning !== undefined
            ? [
                {
                  type: 'reasoning',
                  data: {
                    reasoning: pendingReasoning,
                    time: pendingReasoningTime ?? 0
                  }
                }
              ]
            : [])
        ]
      }
    }

    // Create the new message. Note: we do not include a top-level "reasoning" property.
    const newMessage: Message = {
      id: generateId(),
      role: message.role,
      content: textContent,
      parts: parts.length > 0 ? parts : undefined,
      toolInvocations: toolInvocations.length > 0 ? (toolInvocations as any) : undefined,
      annotations: annotations
    } as any

    chatMessages.push(newMessage)

    // Clear pending state after processing an assistant message.
    if (message.role === 'assistant') {
      pendingAnnotations = []
      pendingReasoning = undefined
      pendingReasoningTime = undefined
    }

    return chatMessages
  }, [])
}

export function convertToExtendedCoreMessages(
  messages: Message[]
): ExtendedCoreMessage[] {
  const result: ExtendedCoreMessage[] = []

  for (const message of messages) {
    // Convert annotations to data messages
    if ((message as any).annotations && (message as any).annotations.length > 0) {
      ;(message as any).annotations.forEach((annotation: JSONValue) => {
        result.push({
          role: 'data',
          content: annotation
        })
      })
    }

    // Convert reasoning to data message with unified structure (including time)
    if ((message as any).reasoning) {
      const reasoningTime = (message as any).reasoningTime ?? 0
      const reasoningData =
        typeof (message as any).reasoning === 'string'
          ? { reasoning: (message as any).reasoning, time: reasoningTime }
          : {
              ...((message as any).reasoning as Record<string, unknown>),
              time:
                (message as any).reasoningTime ??
                ((message as any).reasoning as any).time ??
                0
            }
      result.push({
        role: 'data',
        content: {
          type: 'reasoning',
          data: reasoningData
        } as JSONValue
      })
    }

    if (!(message && typeof message === 'object' && (message as any).role)) {
      continue
    }

    const messageRole = (message as any).role
    const messageParts = Array.isArray((message as any).parts)
      ? ((message as any).parts as any[])
      : []
    const coreParts: Array<any> = []
    const toolResults: Array<any> = []

    for (const part of messageParts) {
      if (!part || typeof part !== 'object') continue

      if (part.type === 'text' && typeof part.text === 'string') {
        coreParts.push({ type: 'text', text: part.text })
      } else if (
        part.type === 'tool-call' &&
        part.toolCallId &&
        part.toolName
      ) {
        coreParts.push({
          type: 'tool-call',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args ?? {}
        })
      } else if (
        part.type === 'tool-result' &&
        part.toolCallId &&
        part.toolName
      ) {
        toolResults.push({
          type: 'tool-result',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          output: part.output ?? part.result
        })
      } else if (
        typeof part.type === 'string' &&
        part.type.startsWith('tool-') &&
        part.type !== 'tool-call' &&
        part.type !== 'tool-result'
      ) {
        const toolName = part.type.replace(/^tool-/, '')
        if (
          (part.state === 'input-streaming' || part.state === 'input-available') &&
          part.toolCallId
        ) {
          coreParts.push({
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName,
            args: part.input ?? {}
          })
        } else if (part.state === 'output-available' && part.toolCallId) {
          toolResults.push({
            type: 'tool-result',
            toolCallId: part.toolCallId,
            toolName,
            output: part.output
          })
        }
      } else if (part.type === 'tool-invocation' && part.toolInvocation) {
        const invocation = part.toolInvocation as any
        if (invocation.state === 'call' && invocation.toolCallId && invocation.toolName) {
          coreParts.push({
            type: 'tool-call',
            toolCallId: invocation.toolCallId,
            toolName: invocation.toolName,
            args: invocation.args ?? {}
          })
        } else if (
          invocation.state === 'result' &&
          invocation.toolCallId &&
          invocation.toolName
        ) {
          toolResults.push({
            type: 'tool-result',
            toolCallId: invocation.toolCallId,
            toolName: invocation.toolName,
            output: invocation.result ?? invocation.output
          })
        }
      }
    }

    const fallbackContent =
      typeof (message as any).content === 'string'
        ? (message as any).content
        : Array.isArray((message as any).content)
        ? (message as any).content
        : ''

    result.push({
      role: messageRole,
      content: coreParts.length > 0 ? coreParts : fallbackContent
    } as any)

    if (toolResults.length > 0) {
      result.push({
        role: 'tool',
        content: toolResults
      } as any)
    }
  }

  return result
}
