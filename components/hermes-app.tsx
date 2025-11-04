'use client'

import { Chat } from '@/components/chat'
import { Model } from '@/lib/types/models'
import { generateId } from 'ai'
import { useState } from 'react'

interface HermesAppProps {
  models: Model[]
}

export function HermesApp({ models }: HermesAppProps) {
  const [chatId] = useState(() => generateId())

  return (
    <div className="h-full w-full hermes-gradient-bg">
      <Chat
        id={chatId}
        models={models}
      />
    </div>
  )
}