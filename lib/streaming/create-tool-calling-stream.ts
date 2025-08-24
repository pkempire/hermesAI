import { researcher } from '@/lib/agents/researcher'
import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  DataStreamWriter,
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
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, userId } = config
      const modelId = `${model.providerId}:${model.id}`

      console.log('🔧 [createToolCallingStreamResponse] =================== STREAM STARTING ===================')
      console.log('🔧 [createToolCallingStreamResponse] Model ID:', modelId)
      console.log('🔧 [createToolCallingStreamResponse] Search Mode:', searchMode)
      console.log('🔧 [createToolCallingStreamResponse] Messages:', messages.length)

      try {
        // Convert UI messages to core/model-compatible messages
        const modelMessages = convertToCoreMessages(messages)

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
            console.log('🔧 [streamText] Step finished:', step.stepType)
            // Note: AI SDK v5 uses different step types - check documentation for exact types
            console.log('🔧 [streamText] Step details:', step)
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
              dataStream,
              userId,
              skipRelatedQuestions: shouldSkipRelatedQuestions
            })
          }
        })

        result.mergeIntoDataStream(dataStream)
      } catch (error) {
        console.error('Stream execution error:', error)
        throw error
      }
    },
    onError: error => {
      // console.error('Stream error:', error)
      return error instanceof Error ? error.message : String(error)
    }
  })
}
