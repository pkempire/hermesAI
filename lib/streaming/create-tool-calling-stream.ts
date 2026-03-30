import { researcher } from '@/lib/agents/researcher'
import { logger } from '@/lib/utils/logger'
import { isReasoningModel } from '../utils/registry'
import { handleStreamFinish } from './handle-stream-finish'
import {
  CoreMessage,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  convertToCoreMessages
} from 'ai'
import { BaseStreamConfig } from './types'

// Function to check if a message contains ask_question tool invocation
function containsAskQuestionTool(message: CoreMessage) {
  // For CoreMessage format, we check the content array
  if (message.role !== 'assistant' || !Array.isArray(message.content)) {
    return false
  }

  // Check if any content item is a tool-call with ask_question tool
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
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
        
        // Clean UI messages to remove problematic tool states before conversion
        const cleanUIMessages = (messages: any[]) => {
          return messages.map((message) => {
            // Filter parts for both user and assistant messages to remove input-available states
            if (message.parts && Array.isArray(message.parts)) {
              return {
                ...message,
                parts: message.parts.filter((part: any) => {
                  // Check if part is an object and has a state property
                  if (typeof part === "object" && part !== null && "state" in part) {
                    return part.state !== "input-available"
                  }
                  // If part doesn't have state property, keep it
                  return true
                }),
              }
            }
            return message
          })
        }

        // Clean UI messages to remove problematic tool states before conversion
        const cleanedMessages = cleanUIMessages(validMessages)
        const modelMessages = convertToCoreMessages(cleanedMessages)
        
        logger.debug('Messages converted successfully:', modelMessages.length)

        let researcherConfig = await researcher({
          messages: modelMessages,
          model: modelId,
          searchMode
        })

        logger.debug('Calling streamText with tools:', Object.keys(researcherConfig.tools || {}))

        const result = streamText({
          ...researcherConfig,
          stopWhen: stepCountIs(5),
          // Tool-call and tool-result parts are automatically included in the stream
          // No need to manually intercept and re-write them
          // Campaign progress events are emitted via custom data-pipeline parts
          onStepFinish: (step) => {
            logger.stream('step_finished')
            // Emit campaign progress events based on tool calls
            // Tool parts are automatically in the stream, no manual copying needed
            try {
              const content = (step as any)?.content as any[] | undefined
              if (Array.isArray(content)) {
                for (const item of content) {
                  if (item?.type === 'tool-call') {
                    // Only emit custom pipeline progress events (not tool data)
                    try {
                      if (item.toolName === 'scrape_site') {
                        writer.write({ type: 'data-pipeline', data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 10, label: 'Analyze your website' } })
                      }
                      if (item.toolName === 'ask_question') {
                        writer.write({ type: 'data-pipeline', data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 15, label: 'Confirm targeting' } })
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
                    } catch {}
                  }
                  if (item?.type === 'tool-result') {
                    // Advance pipeline for chained flows
                    try {
                      if (item.toolName === 'scrape_site') {
                        writer.write({ type: 'data-pipeline', data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 18, label: 'Website analyzed' } })
                      }
                      if (item.toolName === 'ask_question') {
                        writer.write({ type: 'data-pipeline', data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 22, label: 'Target confirmed' } })
                      }
                    } catch {}
                  }
                }
              }
            } catch (e) {
              logger.warn('Failed to emit pipeline events:', e)
            }
          },
          onFinish: async result => {
            // Check if the last message contains an ask_question tool invocation
            const shouldSkipRelatedQuestions =
              isReasoningModel(modelId) ||
              (result.response.messages.length > 0 &&
                containsAskQuestionTool(
                  result.response.messages[
                    result.response.messages.length - 1
                  ] as CoreMessage
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
