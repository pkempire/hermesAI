'use client'

import { Chat } from '@/components/chat'
import { ErrorBoundary } from '@/components/error-boundary'
import { Model } from '@/lib/types/models'
import { generateId } from 'ai'
import { useState } from 'react'

interface HermesAppProps {
  models: Model[]
}

export function HermesApp({ models }: HermesAppProps) {
  const [chatId] = useState(() => generateId())

  return (
    <ErrorBoundary>
      <div className="h-full w-full hermes-gradient-bg pt-0">
        <Chat
          id={chatId}
          models={models}
        />
      </div>
    </ErrorBoundary>
  )
}