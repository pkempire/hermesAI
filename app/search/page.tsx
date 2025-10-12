import { ProspectSearchSection } from '@/components/prospect-search-section'
import { Suspense } from 'react'

export const maxDuration = 60

export default async function SearchPage(props: {
  searchParams: Promise<{ q: string }>
}) {
  // Minimal shell that hosts the prospect search section via agent tools
  // For now, render a placeholder; the section is injected by the chat flow
  return (
    <Suspense>
      <div className="max-w-5xl mx-auto w-full p-4">
        <div className="text-sm text-muted-foreground">Configure Prospect Search</div>
      </div>
    </Suspense>
  )
}
