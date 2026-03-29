/**
 * Exa Webset Caching and Reuse System
 * Optimizes speed by reusing existing websets instead of creating new ones
 */

import { logger } from '@/lib/utils/logger'
import { ExaWebsetsClient } from './exa-websets'

interface CachedWebset {
  websetId: string
  criteria: string[] // Normalized criteria for matching
  entityType: 'person' | 'company'
  enrichments: string[]
  createdAt: number
  lastUsed: number
  status: 'active' | 'completed' | 'failed'
}

interface WebsetSearchParams {
  query: string
  criteria: Array<{ label: string; value: string; type: string }>
  entityType: 'person' | 'company'
  enrichments: Array<{ label: string; value: string }>
  targetCount: number
}

class ExaWebsetCache {
  private cache = new Map<string, CachedWebset>()
  private readonly CACHE_TTL = 1000 * 60 * 60 * 2 // 2 hours
  private readonly MAX_CACHE_SIZE = 50

  /**
   * Generate cache key from search parameters
   */
  private generateCacheKey(params: WebsetSearchParams): string {
    const normalizedCriteria = params.criteria
      .map(c => `${c.type}:${c.value.toLowerCase()}`)
      .sort()
      .join('|')

    const normalizedEnrichments = params.enrichments
      .map(e => e.value.toLowerCase())
      .sort()
      .join('|')

    return `${params.entityType}:${normalizedCriteria}:${normalizedEnrichments}`
  }

  /**
   * Check if we can reuse an existing webset
   */
  async findReusableWebset(params: WebsetSearchParams, exa: ExaWebsetsClient): Promise<string | null> {
    const cacheKey = this.generateCacheKey(params)
    const cached = this.cache.get(cacheKey)

    if (!cached) return null

    // Check if cache entry is still valid
    const now = Date.now()
    if (now - cached.createdAt > this.CACHE_TTL) {
      this.cache.delete(cacheKey)
      return null
    }

    // Verify webset still exists and is usable
    try {
      const webset = await exa.getWebset(cached.websetId)

      // If webset is completed, we can potentially extend it
      if (webset.status === 'idle' || webset.status === 'completed') {
        // Check if we already have enough results
        const items = await exa.listItems(cached.websetId, { limit: params.targetCount })

        if (items.data.length >= params.targetCount) {
          logger.debug('[ExaCache] Reusing completed webset', { websetId: cached.websetId, results: items.data.length })
          cached.lastUsed = now
          return cached.websetId
        }

        // TODO: Could extend the webset with more results here
        // For now, create new webset if we need more results
        logger.debug('[ExaCache] Cached webset is short on results', {
          websetId: cached.websetId,
          currentResults: items.data.length,
          requestedResults: params.targetCount
        })
      }

      // If webset is still running, reuse it
      if (webset.status === 'running' || webset.status === 'processing') {
        logger.debug('[ExaCache] Reusing running webset', { websetId: cached.websetId })
        cached.lastUsed = now
        return cached.websetId
      }

    } catch (error) {
      logger.warn(`[ExaCache] Cached webset ${cached.websetId} is no longer accessible`, error)
      this.cache.delete(cacheKey)
    }

    return null
  }

  /**
   * Cache a new webset
   */
  cacheWebset(params: WebsetSearchParams, websetId: string): void {
    const cacheKey = this.generateCacheKey(params)
    const now = Date.now()

    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries()
    }

    this.cache.set(cacheKey, {
      websetId,
      criteria: params.criteria.map(c => `${c.type}:${c.value}`),
      entityType: params.entityType,
      enrichments: params.enrichments.map(e => e.value),
      createdAt: now,
      lastUsed: now,
      status: 'active'
    })

    logger.debug('[ExaCache] Cached webset', { websetId, cacheKey })
  }

  /**
   * Update webset status
   */
  updateWebsetStatus(websetId: string, status: 'active' | 'completed' | 'failed'): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.websetId === websetId) {
        cached.status = status
        cached.lastUsed = Date.now()
        logger.debug('[ExaCache] Updated cached webset status', { websetId, status })
        break
      }
    }
  }

  /**
   * Clean old cache entries
   */
  private cleanOldEntries(): void {
    const now = Date.now()
    const entriesToDelete: string[] = []

    // Find expired entries
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.createdAt > this.CACHE_TTL) {
        entriesToDelete.push(key)
      }
    }

    // If no expired entries, remove least recently used
    if (entriesToDelete.length === 0) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastUsed - b.lastUsed)

      entriesToDelete.push(sortedEntries[0][0])
    }

    // Delete entries
    entriesToDelete.forEach(key => {
      this.cache.delete(key)
      logger.debug('[ExaCache] Removed cache entry', { key })
    })
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.values()).map(cached => ({
        websetId: cached.websetId,
        entityType: cached.entityType,
        status: cached.status,
        age: Date.now() - cached.createdAt,
        criteriaCount: cached.criteria.length
      }))
    }
  }
}

// Global cache instance
export const exaWebsetCache = new ExaWebsetCache()

/**
 * Optimized webset creation that reuses existing websets when possible
 */
export async function createOrReuseWebset(
  params: WebsetSearchParams,
  exa: ExaWebsetsClient
): Promise<{ websetId: string; isReused: boolean }> {
  logger.debug('[ExaCache] Checking for reusable webset')

  // Try to find reusable webset
  const reusableWebsetId = await exaWebsetCache.findReusableWebset(params, exa)

  if (reusableWebsetId) {
    return { websetId: reusableWebsetId, isReused: true }
  }

  // Create new webset if no reusable one found
  logger.debug('[ExaCache] No reusable webset found, creating a new one')

  // Convert params to Exa format (reuse existing function)
  const { buildWebsetEnrichments, createProspectSearchCriteria } = await import('./exa-websets')

  const searchCriteria = createProspectSearchCriteria({
    query: params.query,
    targetCount: params.targetCount,
    entityType: params.entityType,
    includeEnrichments: params.enrichments.map(e => e.value),
    allCriteria: params.criteria,
    filters: {}
  })

  const enrichments = buildWebsetEnrichments(params.enrichments)

  // Deterministic externalId for Exa to avoid duplicate websets across restarts
  const normalizedCriteria = params.criteria
    .map(c => `${c.type}:${c.value.toLowerCase()}`)
    .sort()
    .join('|')
  const normalizedEnrichments = params.enrichments
    .map(e => e.value.toLowerCase())
    .sort()
    .join('|')
  const extKey = `${params.entityType}:${params.query.toLowerCase().trim()}:${normalizedCriteria}:${normalizedEnrichments}:${params.targetCount}`
  let extHash = 0
  for (let i = 0; i < extKey.length; i++) {
    const ch = extKey.charCodeAt(i)
    extHash = ((extHash << 5) - extHash) + ch
    extHash |= 0
  }
  const externalId = `hermes:webset:${Math.abs(extHash).toString(36)}`

  const webset = await exa.createWebset({
    externalId,
    search: searchCriteria,
    enrichments
  })

  // Cache the new webset
  exaWebsetCache.cacheWebset(params, webset.id)

  return { websetId: webset.id, isReused: false }
}

/**
 * Update webset status in cache
 */
export function updateCachedWebsetStatus(websetId: string, status: 'active' | 'completed' | 'failed') {
  exaWebsetCache.updateWebsetStatus(websetId, status)
}
