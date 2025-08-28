import { getChat, saveChat } from '@/lib/actions/chat'
import { generateRelatedQuestions } from '@/lib/agents/generate-related-questions'
import { ExtendedCoreMessage } from '@/lib/types'
import { convertToExtendedCoreMessages } from '@/lib/utils'
import { CoreMessage, JSONValue, type UIMessage as Message } from 'ai'

interface HandleStreamFinishParams {
  responseMessages: CoreMessage[]
  originalMessages: Message[]
  model: string
  chatId: string
  dataStream: any
  userId: string
  skipRelatedQuestions?: boolean
  annotations?: ExtendedCoreMessage[]
}

export async function handleStreamFinish({
  responseMessages,
  originalMessages,
  model,
  chatId,
  dataStream,
  userId,
  skipRelatedQuestions = false,
  annotations = []
}: HandleStreamFinishParams) {
  try {
    const getTextFromUIMessage = (m: Message): string => {
      if (Array.isArray((m as any).parts)) {
        const texts = (m as any).parts
          .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
        if (texts.length) return texts.join(' ')
      }
      return typeof (m as any).content === 'string' ? (m as any).content : ''
    }

    const extendedCoreMessages = convertToExtendedCoreMessages(originalMessages)
    let allAnnotations = [...annotations]

    // Temporarily disable related questions unless explicitly enabled
    const enableRelated = process.env.ENABLE_RELATED_QUESTIONS === 'true'
    if (!skipRelatedQuestions && enableRelated) {
      // Notify related questions loading
      const relatedQuestionsAnnotation: JSONValue = {
        type: 'related-questions',
        data: { items: [] }
      }
      // AI SDK v5 custom data chunks must start with "data-" and use "data" field
      dataStream.write({ type: 'data-related-questions', data: relatedQuestionsAnnotation })

      // Generate related questions using last user text only (v5-compatible)
      const getTextFromUIMessage = (m: Message): string => {
        // Prefer parts API
        if (Array.isArray((m as any).parts)) {
          const texts = (m as any).parts
            .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
            .map((p: any) => p.text)
          if (texts.length) return texts.join(' ')
        }
        // Fallback to legacy content
        return typeof (m as any).content === 'string' ? (m as any).content : ''
      }

      const lastUserMessage = [...originalMessages].reverse().find(m => m.role === 'user')
      const lastUserText = lastUserMessage ? getTextFromUIMessage(lastUserMessage) : ''

      const relatedQuestions = await generateRelatedQuestions(lastUserText, model)

      // Create and add related questions annotation
      const updatedRelatedQuestionsAnnotation: ExtendedCoreMessage = {
        role: 'data',
        content: {
          type: 'related-questions',
          data: relatedQuestions.object
        } as JSONValue
      }

      dataStream.write({ type: 'data-related-questions', data: updatedRelatedQuestionsAnnotation.content as JSONValue })
      allAnnotations.push(updatedRelatedQuestionsAnnotation)
    }

    // Create the message to save
    const generatedMessages = [
      ...extendedCoreMessages,
      ...responseMessages.slice(0, -1),
      ...allAnnotations, // Add annotations before the last message
      ...responseMessages.slice(-1)
    ] as ExtendedCoreMessage[]

    if (process.env.ENABLE_SAVE_CHAT_HISTORY !== 'true') {
      return
    }

    // Get the chat from the database if it exists, otherwise create a new one
    const savedChat = (await getChat(chatId, userId)) ?? {
      messages: [],
      createdAt: new Date(),
      userId: userId,
      path: `/search/${chatId}`,
      title: ((): string => {
        const firstUser = originalMessages.find(m => m.role === 'user')
        return firstUser ? getTextFromUIMessage(firstUser) : 'New Chat'
      })(),
      id: chatId
    }

    // Save chat with complete response and related questions
    await saveChat(
      {
        ...savedChat,
        messages: generatedMessages
      },
      userId
    ).catch(error => {
      console.error('Failed to save chat:', error)
      throw new Error('Failed to save chat history')
    })
  } catch (error) {
    console.error('Error in handleStreamFinish:', error)
    // Don't throw; avoid breaking the UI stream on non-critical finish tasks
    return
  }
}
