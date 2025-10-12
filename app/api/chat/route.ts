import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { Model } from '@/lib/types/models'
import { chatRateLimit, checkRateLimit, getRateLimitErrorMessage } from '@/lib/utils/rate-limit'
import { isProviderEnabled } from '@/lib/utils/registry'
import { cookies } from 'next/headers'

export const maxDuration = 30

const DEFAULT_MODEL: Model = {
  id: 'gpt-5-mini',
  name: 'GPT-5 Mini',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

export async function POST(req: Request) {
  try {
    const DEBUG = process.env.NODE_ENV !== 'production'
    const { messages, id: chatId } = await req.json()
    // Basic validation and soft rate-limit key
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Missing messages', { status: 400 })
    }
    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')
    const userId = await getCurrentUserId()
    // Enforce authenticated users for sending messages
    if (!userId || userId === 'anonymous') {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(userId, chatRateLimit)
    if (!rateLimitResult.success) {
      const errorMessage = getRateLimitErrorMessage('chat', rateLimitResult.reset)
      return new Response(errorMessage, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
        }
      })
    }

    DEBUG && console.log('🔧 [API] =================== CHAT API REQUEST ===================')
    DEBUG && console.log('🔧 [API] Chat ID:', chatId)
    DEBUG && console.log('🔧 [API] Messages count:', messages.length)
    DEBUG && console.log('🔧 [API] Last message:', messages[messages.length - 1]?.content)
    DEBUG && console.log('🔧 [API] User ID:', userId)

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    const cookieStore = await cookies()
    const modelJson = cookieStore.get('selectedModel')?.value
    const searchMode = cookieStore.get('search-mode')?.value === 'true'

    let selectedModel = DEFAULT_MODEL

    if (modelJson) {
      try {
        selectedModel = JSON.parse(modelJson) as Model
      } catch (e) {
        console.error('Failed to parse selected model:', e)
      }
    }

    if (
      !isProviderEnabled(selectedModel.providerId) ||
      selectedModel.enabled === false
    ) {
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404,
          statusText: 'Not Found'
        }
      )
    }

    const supportsToolCalling = selectedModel.toolCallType === 'native'

    DEBUG && console.log('🔧 [API] Selected model:', selectedModel.name)
    DEBUG && console.log('🔧 [API] Search mode:', searchMode)
    DEBUG && console.log('🔧 [API] Supports tool calling:', supportsToolCalling)

    return supportsToolCalling
      ? createToolCallingStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode,
          userId
        })
      : createManualToolStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode,
          userId
        })
  } catch (error) {
    console.error('API route error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
