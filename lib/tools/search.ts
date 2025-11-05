import { getSearchSchemaForModel } from '@/lib/schema/search'
import { SearchResults } from '@/lib/types'
import { getBaseUrlString } from '@/lib/utils/url'
import { tool } from 'ai'
import { z } from 'zod'
import { DEFAULT_PROVIDER, SearchProviderType, createSearchProvider } from './search/providers'

/**
 * Creates a search tool with the appropriate schema for the given model.
 */
// Track search calls to prevent loops (in-memory, per-process)
const searchCallHistory: Map<string, number> = new Map()
const MAX_SEARCH_CALLS_PER_CONVERSATION = 3

export function createSearchTool(fullModel: string) {
  const schema = getSearchSchemaForModel(fullModel) || z.object({})
  return tool({
    description: 'Search the web for information. IMPORTANT: Do not call this tool repeatedly. Maximum 2-3 searches per conversation. If you already searched for something, use that information.',
    inputSchema: schema ?? ({} as any),
    execute: async ({
      query,
      max_results = 20,
      search_depth = 'basic', // Default for standard schema
      include_domains = [],
      exclude_domains = []
    }) => {
      // Prevent search loops by tracking calls
      const queryKey = query.toLowerCase().trim()
      const callCount = searchCallHistory.get(queryKey) || 0
      
      if (callCount >= MAX_SEARCH_CALLS_PER_CONVERSATION) {
        console.warn(`[Search] Blocked repeated search for: ${query} (${callCount} calls)`)
        return {
          results: [],
          query: query,
          images: [],
          number_of_results: 0,
          error: 'Search limit reached. Please use previous search results.'
        }
      }
      
      searchCallHistory.set(queryKey, callCount + 1)
      // Ensure max_results is at least 10
      const minResults = 10
      const effectiveMaxResults = Math.max(
        max_results || minResults,
        minResults
      )
      const effectiveSearchDepth = search_depth as 'basic' | 'advanced'

      // Use the original query as is - any provider-specific handling will be done in the provider
      const filledQuery = query
      let searchResult: SearchResults
      const searchAPI =
        (process.env.SEARCH_API as SearchProviderType) || DEFAULT_PROVIDER

      const effectiveSearchDepthForAPI =
        searchAPI === 'searxng' &&
        process.env.SEARXNG_DEFAULT_DEPTH === 'advanced'
          ? 'advanced'
          : effectiveSearchDepth || 'basic'

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `Using search API: ${searchAPI}, Search Depth: ${effectiveSearchDepthForAPI}`
        )
      }

      try {
        if (
          searchAPI === 'searxng' &&
          effectiveSearchDepthForAPI === 'advanced'
        ) {
          // Get the base URL using the centralized utility function
          const baseUrl = await getBaseUrlString()
          
          const response = await fetch(`${baseUrl}/api/advanced-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: filledQuery,
              maxResults: effectiveMaxResults,
              searchDepth: effectiveSearchDepthForAPI,
              includeDomains: include_domains,
              excludeDomains: exclude_domains
            })
          })
          if (!response.ok) {
            throw new Error(
              `Advanced search API error: ${response.status} ${response.statusText}`
            )
          }
          searchResult = await response.json()
        } else {
          // Use the provider factory to get the appropriate search provider
          const searchProvider = createSearchProvider(searchAPI)
          searchResult = await searchProvider.search(
            filledQuery,
            effectiveMaxResults,
            effectiveSearchDepthForAPI,
            include_domains,
            exclude_domains
          )
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Search API error:', error)
        }
        searchResult = {
          results: [],
          query: filledQuery,
          images: [],
          number_of_results: 0
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('completed search')
      }
      return searchResult
    }
  })
}

// Default export for backward compatibility, using a default model
export const searchTool = createSearchTool('openai:gpt-5-mini')

export async function search(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const exec = (searchTool as any)?.execute
  if (typeof exec !== 'function') {
    throw new Error('search tool execute is unavailable')
  }

  const result = await exec(
    {
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains
    },
    {
      toolCallId: 'search',
      messages: []
    }
  ) as SearchResults | AsyncIterable<SearchResults>

  // If the tool yielded a stream, consume and return the last value
  if (result && typeof (result as any)[Symbol.asyncIterator] === 'function') {
    let last: SearchResults | undefined
    for await (const chunk of result as AsyncIterable<SearchResults>) {
      last = chunk
    }
    return (
      last ?? {
        results: [],
        images: [],
        query,
        number_of_results: 0
      }
    )
  }

  return result as SearchResults
}
