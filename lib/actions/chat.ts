'use server'

import { createClient } from '@/lib/supabase/server'
import { ExtendedCoreMessage } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// Chat data structure for saving conversations
interface Chat {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: ExtendedCoreMessage[]
}

export async function getChat(chatId: string, userId: string): Promise<Chat | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at),
      userId: data.user_id,
      path: data.path,
      messages: data.messages || []
    }
  } catch (error) {
    console.error('Error getting chat:', error)
    return null
  }
}

export async function saveChat(chat: Chat, userId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    // ensure subscription row exists
    await supabase
      .from('subscriptions')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })

    const { error } = await supabase
      .from('chats')
      .upsert({
        id: chat.id,
        user_id: userId,
        title: chat.title,
        path: chat.path,
        messages: chat.messages,
        created_at: chat.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving chat:', error)
      throw new Error('Failed to save chat')
    }

    revalidatePath('/search')
  } catch (error) {
    console.error('Error in saveChat:', error)
    throw error
  }
}

export async function getChatsPage(page: number, userId: string): Promise<{ chats: Chat[]; hasMore: boolean }> {
  try {
    const supabase = await createClient()
    const limit = 20
    const offset = page * limit
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error getting chats page:', error)
      return { chats: [], hasMore: false }
    }

    const chats = data.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: new Date(chat.created_at),
      userId: chat.user_id,
      path: chat.path,
      messages: chat.messages || []
    }))

    return {
      chats,
      hasMore: data.length === limit
    }
  } catch (error) {
    console.error('Error in getChatsPage:', error)
    return { chats: [], hasMore: false }
  }
}

export async function deleteChat(chatId: string, userId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting chat:', error)
      throw new Error('Failed to delete chat')
    }

    revalidatePath('/search')
  } catch (error) {
    console.error('Error in deleteChat:', error)
    throw error
  }
}

export async function shareChat(chatId: string) {
  // This was used for sharing chat conversations
  // Not needed for our cold email prospecting use case
  return { success: false, error: 'Chat sharing not implemented in HermesAI' }
}

export async function getSharedChat(chatId: string) {
  // This was used for retrieving shared chats
  // Not needed for our cold email prospecting use case
  return null
}

export async function clearChats() {
  // This was used for clearing chat history
  // Not needed for our cold email prospecting use case
  return { success: false, error: 'Chat clearing not implemented in HermesAI' }
} 