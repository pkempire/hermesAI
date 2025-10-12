import { getChatsPage } from '@/lib/actions/chat'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { type Chat } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

interface ChatPageResponse {
  chats: Chat[]
  nextOffset: number | null
}

export async function GET(request: NextRequest) {
  const enableSaveChatHistory = process.env.ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return NextResponse.json<ChatPageResponse>({ chats: [], nextOffset: null })
  }

  const { searchParams } = new URL(request.url)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const userId = await getCurrentUserId()

  // Return empty if user is not authenticated (no point querying with 'anonymous')
  if (userId === 'anonymous') {
    return NextResponse.json<ChatPageResponse>({ chats: [], nextOffset: null })
  }

  try {
    const page = Math.floor(offset / limit)
    const result = await getChatsPage(page, userId)
    
    // Convert to API response format
    const response: ChatPageResponse = {
      chats: result.chats,
      nextOffset: result.hasMore ? offset + limit : null
    }
    
    return NextResponse.json<ChatPageResponse>(response)
  } catch (error) {
    console.error('API route error fetching chats:', error)
    return NextResponse.json<ChatPageResponse>(
      { chats: [], nextOffset: null },
      { status: 500 }
    )
  }
}
