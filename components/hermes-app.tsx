'use client'

import { Chat } from '@/components/chat'
import { ErrorBoundary } from '@/components/error-boundary'
import { Model } from '@/lib/types/models'
import { generateId } from 'ai'
import { useState } from 'react'

interface HermesAppProps {
  models: Model[]
  signedIn?: boolean
}

export function HermesApp({ models, signedIn = true }: HermesAppProps) {
  const [chatId] = useState(() => generateId())

  return (
    <ErrorBoundary>
      <div className="h-full w-full bg-[hsl(var(--hermes-cream))] pt-0">
        <Chat id={chatId} models={models} signedIn={signedIn} />
      </div>
    </ErrorBoundary>
  )
}
