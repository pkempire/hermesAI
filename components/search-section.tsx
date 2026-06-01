'use client'

import { useArtifact } from '@/components/artifact/artifact-context'
import { CHAT_ID } from '@/lib/constants'
import type { SearchResults as TypeSearchResults } from '@/lib/types'
import { useChat } from '@ai-sdk/react'
// import { ToolInvocation } from 'ai'
import { CollapsibleMessage } from './collapsible-message'
import { SearchSkeleton } from './default-skeleton'
import { SearchResults } from './search-results'
import { SearchResultsImageSection } from './search-results-image'
import { Section, ToolArgsSection } from './section'

type ToolInvocation = any

interface SearchSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange
}: SearchSectionProps) {
  const { status } = useChat({
    id: CHAT_ID
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  const isToolLoading = tool.state === 'call'
  const searchResults: TypeSearchResults =
    tool.state === 'result' ? tool.result : undefined
  const query = tool.args?.query as string | undefined
  const includeDomains = (tool.args?.include_domains || tool.args?.includeDomains) as string[] | undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''
  const provider = searchResults?.provider || 'unknown'
  const depth = searchResults?.search_depth || tool.args?.search_depth || 'basic'
  const resultCount = searchResults?.results?.length ?? undefined

  const { open } = useArtifact()
  const header = (
    <button
      type="button"
      onClick={() => open({ type: 'tool-invocation', toolInvocation: tool })}
      className="flex items-center justify-between w-full text-left rounded-md p-1 -ml-1"
      title="Open details"
    >
      <ToolArgsSection
        tool="search"
        number={resultCount}
      >{`${query || 'web search'}${includeDomainsString}`}</ToolArgsSection>
    </button>
  )

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showIcon={false}
    >
      {searchResults && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--steel))]">
          <span className="rounded-full border border-[hsl(var(--mist))] bg-white px-2 py-1">
            Provider: {provider}
          </span>
          <span className="rounded-full border border-[hsl(var(--mist))] bg-white px-2 py-1">
            Depth: {depth}
          </span>
          <span className="rounded-full border border-[hsl(var(--mist))] bg-white px-2 py-1">
            Results: {resultCount ?? 0}
          </span>
        </div>
      )}
      {searchResults &&
        searchResults.images &&
        searchResults.images.length > 0 && (
          <Section>
            <SearchResultsImageSection
              images={searchResults.images}
              query={query}
            />
          </Section>
        )}
      {isLoading && isToolLoading ? (
        <SearchSkeleton />
      ) : searchResults?.results ? (
        <Section title="Sources">
          <SearchResults results={searchResults.results} />
        </Section>
      ) : null}
    </CollapsibleMessage>
  )
}
