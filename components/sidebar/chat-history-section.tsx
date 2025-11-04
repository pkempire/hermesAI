import { ChatHistoryClient } from './chat-history-client'

export async function ChatHistorySection() {
  // Always show history - remove feature flag
  return <ChatHistoryClient />
}
