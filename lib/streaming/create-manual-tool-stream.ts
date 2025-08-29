import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  JSONValue,
  streamText
} from 'ai'
import { manualResearcher } from '../agents/manual-researcher'
import { ExtendedCoreMessage } from '../types'
import { handleStreamFinish } from './handle-stream-finish'
import { executeToolCall } from './tool-execution'
import { BaseStreamConfig } from './types'

export function createManualToolStreamResponse(config: BaseStreamConfig) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      async execute({ writer }) {
      const { messages, model, chatId, searchMode, userId } = config
      const modelId = `${model.providerId}:${model.id}`
      let toolCallModelId = model.toolCallModel
        ? `${model.providerId}:${model.toolCallModel}`
        : modelId

      try {
        // Convert UI messages to minimal CoreMessage for model
        const modelMessages = messages.map((msg: any) => ({
          role: msg.role,
          content:
            typeof msg.content === 'string'
              ? msg.content
              : Array.isArray(msg.content)
              ? msg.content
              : ''
        })) as any

        const { toolCallDataAnnotation, toolCallMessages } =
          await executeToolCall(
            modelMessages,
            writer,
            toolCallModelId,
            searchMode
          )

        const researcherConfig = manualResearcher({
          messages: [...modelMessages, ...toolCallMessages],
          model: modelId,
          isSearchEnabled: searchMode
        })

        // Variables to track the reasoning timing.
        let reasoningStartTime: number | null = null
        let reasoningDuration: number | null = null

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            const annotations: ExtendedCoreMessage[] = [
              ...(toolCallDataAnnotation ? [toolCallDataAnnotation] : []),
              {
                role: 'data',
                content: ({
                  type: 'reasoning',
                  data: {
                    time: reasoningDuration ?? 0,
                    reasoning: result.reasoning
                  }
                } as unknown) as JSONValue
              }
            ]

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream: writer,
              userId,
              skipRelatedQuestions: true,
              annotations
            })
          },
          onChunk(event) {
            const chunkType = event.chunk?.type

            if (chunkType === 'reasoning-delta') {
              if (reasoningStartTime === null) {
                reasoningStartTime = Date.now()
              }
            } else {
              if (reasoningStartTime !== null) {
                const elapsedTime = Date.now() - reasoningStartTime
                reasoningDuration = elapsedTime
                writer.write({
                  type: 'data-reasoning',
                  data: { time: elapsedTime }
                })
                reasoningStartTime = null
              }
            }
          }
        })

        writer.merge(result.toUIMessageStream({
          sendReasoning: true
        }))
      } catch (error) {
        console.error('Stream execution error:', error)
      }
    },
    onError: error => {
      console.error('Stream error:', error)
      return error instanceof Error ? error.message : String(error)
    }
    })
  })
}
