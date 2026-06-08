import { createHermesAgent } from '@/lib/agents/researcher'
import { logger } from '@/lib/utils/logger'
import { isReasoningModel } from '../utils/registry'
import { handleStreamFinish } from './handle-stream-finish'
import {
  ModelMessage,
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
  safeValidateUIMessages
} from 'ai'
import { BaseStreamConfig } from './types'

function summarizeToolPartForModel(part: any): any | null {
  const type = typeof part?.type === 'string' ? part.type : ''
  const isTypedTool = type.startsWith('tool-') && !['tool-call', 'tool-result', 'tool-invocation'].includes(type)
  if (!isTypedTool && !['tool-call', 'tool-result', 'tool-invocation'].includes(type)) {
    return part
  }

  const toolName =
    isTypedTool
      ? type.replace(/^tool-/, '')
      : part.toolName || part?.toolInvocation?.toolName
  const output =
    part.output ??
    part.result ??
    part?.toolInvocation?.result ??
    part?.toolInvocation?.output

  if (output === undefined || output === null) {
    return null
  }

  let text: string
  if (typeof output === 'string') {
    text = output
  } else {
    try {
      text = JSON.stringify(output)
    } catch {
      text = String(output)
    }
  }

  return {
    type: 'text',
    text: `\n[${toolName || 'tool'} result]\n${text.slice(0, 6000)}\n`
  }
}

// Function to check if a message contains ask_question tool invocation
function containsAskQuestionTool(message: ModelMessage) {
  // For ModelMessage format, we check the content array
  if (message.role !== 'assistant' || !Array.isArray(message.content)) {
    return false
  }

  // Check if any content item is a tool-call with ask_question tool
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}

function emitPipelineEventsForStep(step: any, writer: any) {
  try {
    const content = step?.content as any[] | undefined
    if (!Array.isArray(content)) return

    for (const item of content) {
      if (item?.type === 'tool-call') {
        if (item.toolName === 'scrape_site') {
          writer.write({
            type: 'data-pipeline',
            data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 10, label: 'Analyze your website' }
          })
        }
        if (item.toolName === 'ask_question') {
          writer.write({
            type: 'data-pipeline',
            data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 15, label: 'Confirm targeting' }
          })
        }
        if (item.toolName === 'prospect_search') {
          writer.write({
            type: 'data-pipeline',
            data: {
              scope: 'campaign',
              stepNumber: 1,
              totalSteps: 5,
              percent: 20,
              label: 'Configure Prospect Search'
            }
          })
        }
      }
      if (item?.type === 'tool-result') {
        if (item.toolName === 'scrape_site') {
          writer.write({
            type: 'data-pipeline',
            data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 18, label: 'Website analyzed' }
          })
        }
        if (item.toolName === 'ask_question') {
          writer.write({
            type: 'data-pipeline',
            data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 22, label: 'Target confirmed' }
          })
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to emit pipeline events:', error)
  }
}

export function createToolCallingStreamResponse(config: BaseStreamConfig) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      async execute({ writer }) {
        const { messages, model, chatId, searchMode, userId } = config
        
        logger.debug('Config received:', {
          hasMessages: !!messages,
          messagesLength: messages?.length,
          hasModel: !!model,
          hasChatId: !!chatId,
          searchMode,
          userId
        })
      const modelId = `${model.providerId}:${model.id}`

      logger.stream('start', { modelId, searchMode, messagesCount: messages.length })

      try {
        // Guard against undefined messages
        if (!messages || !Array.isArray(messages)) {
          logger.error('Messages is undefined or not an array:', messages)
          throw new Error('Messages array is required for AI processing')
        }
        
        // Validate and clean messages before conversion
        const validMessages = messages.filter((msg: any) => {
          const isValid =
            msg &&
            typeof msg === 'object' &&
            msg.role &&
            (
              typeof msg.content === 'string' ||
              Array.isArray(msg.content) ||
              Array.isArray((msg as any).parts)
            )
          
          if (!isValid) {
            logger.warn('Invalid message filtered out:', msg)
          }
          return isValid
        })
        
        logger.debug('Valid messages for conversion:', validMessages.length)

        const agent = createHermesAgent({
          model: modelId,
          searchMode,
          userId,
          onStepFinish: step => {
            logger.stream('agent_step_finished', {
              stepNumber: step.stepNumber,
              finishReason: step.finishReason,
              toolCalls: step.toolCalls.length,
              toolResults: step.toolResults.length
            })
            emitPipelineEventsForStep(step, writer)
          },
          onFinish: async result => {
            const shouldSkipRelatedQuestions =
              isReasoningModel(modelId) ||
              (result.response.messages.length > 0 &&
                containsAskQuestionTool(
                  result.response.messages[
                    result.response.messages.length - 1
                  ] as ModelMessage
                ))

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream: writer,
              userId,
              skipRelatedQuestions: shouldSkipRelatedQuestions
            })
          }
        })

        const validatedMessages = await safeValidateUIMessages({
          messages: validMessages,
          tools: agent.tools as any
        })
        if (!validatedMessages.success) {
          logger.warn('UI message validation fell back to sanitizer:', validatedMessages.error)
        }

        // Clean UI messages to remove problematic tool states before conversion
        const cleanUIMessages = (messages: any[]) => {
          return messages.map((message) => {
            if (message.parts && Array.isArray(message.parts)) {
              return {
                ...message,
                parts: message.parts
                  .map((part: any) => summarizeToolPartForModel(part))
                  .filter(Boolean)
              }
            }
            return message
          })
        }

        // Clean UI messages to remove problematic tool states before conversion
        const messagesForConversion = validatedMessages.success ? validatedMessages.data : validMessages
        const cleanedMessages = cleanUIMessages(messagesForConversion).filter((message: any) => {
          if (Array.isArray(message?.parts)) return message.parts.length > 0
          if (Array.isArray(message?.content)) return message.content.length > 0
          return typeof message?.content === 'string' && message.content.trim().length > 0
        })
        const modelMessages = await convertToModelMessages(cleanedMessages, {
          tools: agent.tools as any,
          ignoreIncompleteToolCalls: true
        })

        logger.debug('Messages converted successfully:', modelMessages.length)

        logger.debug('Calling ToolLoopAgent with tools:', Object.keys(agent.tools || {}))

        const result = await agent.stream({
          messages: modelMessages,
          timeout: { totalMs: 28000 }
        })

        writer.merge(result.toUIMessageStream())
      } catch (error) {
        logger.error('Stream execution error:', error)
        throw error
      }
    },
    onError: error => {
      logger.error('Stream error:', error)
      const message = error instanceof Error ? error.message : String(error)
      
      // Map cryptic Exa/Item-not-found errors to user-friendly messages
      if (message.includes('rs_') || message.includes('not found') || message.includes('websetId')) {
        return 'The research session for this campaign has expired. Please start a new brief.'
      }
      
      return message
    }
    })
  })
}
