'use client'

import dynamic from 'next/dynamic'

const HermesApp = dynamic(
  () => import('@/components/hermes-app').then(mod => mod.HermesApp),
  {
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--paper))] text-sm text-[hsl(var(--steel))]">
        Loading Hermes workspace...
      </div>
    )
  }
)

export function HermesAppLoader() {
  return <HermesApp />
}
