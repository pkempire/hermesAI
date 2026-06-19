import { getSearchSchemaForModel } from '@/lib/schema/search'
import { SearchResults } from '@/lib/types'
import { getBaseUrlString } from '@/lib/utils/url'
import { tool } from 'ai'
import { z } from 'zod'
import { DEFAULT_PROVIDER, SearchProviderType, createSearchProvider } from './search/providers'

/**
 * Creates a search tool with the appropriate schema for the given model.
 */
// Track search calls to prevent loops. Keyed off the process; reset between
// dev restarts. We cap on TOTAL calls — not per-query — because the model
// often varies the wording on each retry, and the prior per-query key let
// it loop forever.
let totalSearchCallsThisProcess = 0
const searchCallsByQuery: Map<string, number> = new Map()
const MAX_SEARCH_CALLS_HARD_LIMIT = 10
const MAX_SAME_QUERY = 2

export function createSearchTool(fullModel: string) {
  const schema = getSearchSchemaForModel(fullModel) || z.object({})
  return tool({
    description:
      'Generic web search for background facts and source checks. Do not use for lead lists or entity discovery; use prospect_search for that. Use sparingly: prefer prospect_search for finding entities, scrape_site for analysing a known site. ' +
      'Hard limits: max 10 search calls per server lifetime, max 2 of any specific query. ' +
      'Always cite specific results back to the user; do not call again with a slight rewording.',
    inputSchema: schema ?? ({} as any),
    execute: async ({
      query,
      max_results = 20,
      search_depth = 'basic',
      include_domains = [],
      exclude_domains = []
    }) => {
      const queryKey = (query || '').toLowerCase().trim()
      if (!queryKey) {
        return {
          results: [],
          query: query || '',
          images: [],
          number_of_results: 0,
          error: 'Empty query — refine and call prospect_search instead.'
        }
      }

      const sameCount = searchCallsByQuery.get(queryKey) || 0
      if (sameCount >= MAX_SAME_QUERY) {
        return {
          results: [],
          query,
          images: [],
          number_of_results: 0,
          error: `You already searched "${query}" ${sameCount} times. Use those results.`
        }
      }
      if (totalSearchCallsThisProcess >= MAX_SEARCH_CALLS_HARD_LIMIT) {
        return {
          results: [],
          query,
          images: [],
          number_of_results: 0,
          error: 'Hit hard search-call ceiling for this process. Use what you have, or hand off to prospect_search for entity discovery.'
        }
      }
      searchCallsByQuery.set(queryKey, sameCount + 1)
      totalSearchCallsThisProcess += 1
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
        throw error instanceof Error
          ? error
          : new Error('Search provider failed')
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('completed search')
      }
      return {
        ...searchResult,
        provider: searchAPI,
        search_depth: effectiveSearchDepthForAPI
      }
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
