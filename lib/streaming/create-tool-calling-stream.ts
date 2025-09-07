import { researcher } from '@/lib/agents/researcher'
import {
  CoreMessage,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText
} from 'ai'
import { isReasoningModel } from '../utils/registry'
import { handleStreamFinish } from './handle-stream-finish'
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
        
        console.log('🔧 [createToolCallingStreamResponse] Config received:', {
          hasMessages: !!messages,
          messagesType: typeof messages,
          messagesLength: messages?.length,
          hasModel: !!model,
          hasChatId: !!chatId,
          searchMode,
          userId
        })
      const modelId = `${model.providerId}:${model.id}`

      console.log('🔧 [createToolCallingStreamResponse] =================== STREAM STARTING ===================')
      console.log('🔧 [createToolCallingStreamResponse] Model ID:', modelId)
      console.log('🔧 [createToolCallingStreamResponse] Search Mode:', searchMode)
      console.log('🔧 [createToolCallingStreamResponse] Messages:', messages.length)

      try {
        // Debug messages before conversion
        console.log('🔧 [createToolCallingStreamResponse] Messages type:', typeof messages)
        console.log('🔧 [createToolCallingStreamResponse] Messages is array:', Array.isArray(messages))
        console.log('🔧 [createToolCallingStreamResponse] Messages content:', messages)
        
        // Guard against undefined messages
        if (!messages || !Array.isArray(messages)) {
          console.error('❌ [createToolCallingStreamResponse] Messages is undefined or not an array:', messages)
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
            console.warn('❌ [createToolCallingStreamResponse] Invalid message filtered out:', msg)
          }
          return isValid
        })
        
        console.log('🔧 [createToolCallingStreamResponse] Valid messages for conversion:', validMessages.length)
        
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

        // Convert UI messages to core/model-compatible messages with proper cleaning
        // Use manual conversion to CoreMessage to avoid v5 UI-only fields
        const cleanedMessages = cleanUIMessages(validMessages)
        const modelMessages = cleanedMessages.map((msg: any) => {
          let content: any = ''
          if (typeof msg.content === 'string') {
            content = msg.content
          } else if (Array.isArray(msg.content)) {
            content = msg.content
          } else if (Array.isArray(msg.parts)) {
            const text = msg.parts
              .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
              .map((p: any) => p.text)
              .join(' ')
            content = text || ''
          }
          return { role: msg.role, content }
        })
        console.log('✅ [createToolCallingStreamResponse] Messages converted successfully:', modelMessages.length)

        let researcherConfig = await researcher({
          messages: modelMessages,
          model: modelId,
          searchMode
        })

        console.log('🔧 [createToolCallingStreamResponse] About to call streamText with tools:', Object.keys(researcherConfig.tools || {}))
        console.log('🔧 [createToolCallingStreamResponse] Active tools:', researcherConfig.experimental_activeTools)

        const result = streamText({
          ...researcherConfig,
          onStepFinish: (step) => {
            console.log('🔧 [streamText] Step finished')
            console.log('🔧 [streamText] Step details:', step)
            // Mirror tool-call and tool-result into data chunks for immediate UI rendering
            try {
              const content = (step as any)?.content as any[] | undefined
              if (Array.isArray(content)) {
                for (const item of content) {
                  if (item?.type === 'tool-call') {
                    // Mirror tool-call to message metadata for UI
                    writer.write({
                      type: 'message-metadata',
                      messageMetadata: {
                        type: 'tool_call',
                        data: {
                          state: 'call',
                          toolCallId: item.toolCallId,
                          toolName: item.toolName,
                          args: JSON.stringify(item.args ?? {})
                        }
                      }
                    })
                    // Emit concise pipeline guidance for chained flows
                    try {
                      if (item.toolName === 'scrape_site') {
                        writer.write({ type: 'data-pipeline', data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 10, label: 'Analyze your website' } })
                      }
                      if (item.toolName === 'ask_question') {
                        writer.write({ type: 'data-pipeline', data: { scope: 'campaign', stepNumber: 1, totalSteps: 5, percent: 15, label: 'Confirm targeting' } })
                      }
                    } catch {}
                    // Emit pipeline step (persistent campaign tracker)
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
                    const output = item.output
                    let result: string | undefined
                    try {
                      if (output?.type === 'json') result = JSON.stringify(output.value)
                      else if (output?.type === 'text') result = output.value
                      else if (output) result = JSON.stringify(output)
                    } catch {}
                    writer.write({
                      type: 'message-metadata',
                      messageMetadata: {
                        type: 'tool_call',
                        data: {
                          state: 'result',
                          toolCallId: item.toolCallId,
                          toolName: item.toolName,
                          result
                        }
                      }
                    })
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
              console.warn('⚠️ [streamText] Failed to mirror tool data to UI:', e)
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
        console.error('Stream execution error:', error)
        throw error
      }
    },
    onError: error => {
      console.error('Stream error:', error)
      return error instanceof Error ? error.message : String(error)
    }
    })
  })
}
