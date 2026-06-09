'use client'

import { Chat } from '@/components/chat'
import { ErrorBoundary } from '@/components/error-boundary'
import { generateId } from 'ai'
import { useState } from 'react'

export function HermesApp() {
  const [chatId] = useState(() => generateId())

  return (
    <ErrorBoundary>
      <div className="h-full w-full bg-[hsl(var(--paper))] pt-0">
        <Chat id={chatId} />
      </div>
    </ErrorBoundary>
  )
}
