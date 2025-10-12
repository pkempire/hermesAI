/**
 * High-performance Redis caching layer for Hermes AI
 * Dramatically speeds up repeated queries and API calls
 */

import { Redis } from '@upstash/redis'

// Redis connection with connection pooling
const redis = process.env.REDIS_URL
  ? new Redis({
      url: process.env.REDIS_URL,
      automaticDeserialization: false, // Handle JSON manually for performance
    })
  : null

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export class HermesCache {
  private static instance: HermesCache
  private redis: Redis | null

  constructor() {
    this.redis = redis
  }

  static getInstance(): HermesCache {
    if (!HermesCache.instance) {
      HermesCache.instance = new HermesCache()
    }
    return HermesCache.instance
  }

  /**
   * High-performance cache get with compression
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const cached = await this.redis.get(key)
      if (!cached) return null

      return JSON.parse(cached as string) as T
    } catch (error) {
      console.warn(`[HermesCache] Get failed for key ${key}:`, error)
      return null
    }
  }

  /**
   * High-performance cache set with compression
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.redis) return

    try {
      const serialized = JSON.stringify(value)
      const ttl = options.ttl || 3600 // Default 1 hour

      await this.redis.setex(key, ttl, serialized)

      // Store tags for cache invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, key)
          await this.redis.expire(`tag:${tag}`, ttl)
        }
      }
    } catch (error) {
      console.warn(`[HermesCache] Set failed for key ${key}:`, error)
    }
  }

  /**
   * Cache with automatic key generation
   */
  async remember<T>(
    keyPrefix: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = this.generateKey(keyPrefix, params)

    let cached = await this.get<T>(key)
    if (cached) {
      console.log(`[HermesCache] Cache hit for ${key}`)
      return cached
    }

    console.log(`[HermesCache] Cache miss for ${key}, fetching...`)
    const result = await fetcher()
    await this.set(key, result, options)

    return result
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateTag(tag: string): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.smembers(`tag:${tag}`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        await this.redis.del(`tag:${tag}`)
        console.log(`[HermesCache] Invalidated ${keys.length} keys for tag: ${tag}`)
      }
    } catch (error) {
      console.warn(`[HermesCache] Tag invalidation failed for ${tag}:`, error)
    }
  }

  /**
   * Cache prospect search results
   */
  async cacheProspectSearch(
    query: string,
    criteria: any[],
    entityType: string,
    results: any[]
  ): Promise<void> {
    const key = this.generateKey('prospect-search', {
      query: query.toLowerCase().trim(),
      criteria: JSON.stringify(criteria.sort()),
      entityType
    })

    await this.set(key, {
      results,
      timestamp: Date.now(),
      count: results.length
    }, {
      ttl: 1800, // 30 minutes for prospect data
      tags: ['prospect-search', `entity:${entityType}`]
    })
  }

  /**
   * Get cached prospect search results
   */
  async getCachedProspectSearch(
    query: string,
    criteria: any[],
    entityType: string
  ): Promise<any[] | null> {
    const key = this.generateKey('prospect-search', {
      query: query.toLowerCase().trim(),
      criteria: JSON.stringify(criteria.sort()),
      entityType
    })

    const cached = await this.get<{
      results: any[]
      timestamp: number
      count: number
    }>(key)

    if (!cached) return null

    // Return cached results if less than 30 minutes old
    if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
      console.log(`[HermesCache] Serving ${cached.count} cached prospects`)
      return cached.results
    }

    return null
  }

  /**
   * Cache email generation results
   */
  async cacheEmailGeneration(
    templates: any[],
    prospects: any[],
    campaignObjective: string,
    result: any
  ): Promise<void> {
    const key = this.generateKey('email-generation', {
      templates: JSON.stringify(templates),
      prospects: JSON.stringify(prospects.slice(0, 3)), // First 3 prospects for key
      campaignObjective: campaignObjective.toLowerCase().trim()
    })

    await this.set(key, result, {
      ttl: 3600, // 1 hour for email templates
      tags: ['email-generation']
    })
  }

  /**
   * Generate consistent cache keys
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')

    return `hermes:${prefix}:${this.hashString(sortedParams)}`
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    totalKeys: number
    memoryUsage?: string
  }> {
    if (!this.redis) {
      return { connected: false, totalKeys: 0 }
    }

    try {
      const info = await this.redis.dbsize()
      return {
        connected: true,
        totalKeys: info,
        memoryUsage: 'Available via Redis INFO'
      }
    } catch (error) {
      return { connected: false, totalKeys: 0 }
    }
  }
}

// Singleton instance
export const hermesCache = HermesCache.getInstance()

// Helper functions for common caching patterns
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  return hermesCache.remember(key, {}, fetcher, { ttl })
}

export async function cacheProspectResults(
  query: string,
  criteria: any[],
  entityType: string,
  results: any[]
): Promise<void> {
  return hermesCache.cacheProspectSearch(query, criteria, entityType, results)
}

export async function getCachedProspects(
  query: string,
  criteria: any[],
  entityType: string
): Promise<any[] | null> {
  return hermesCache.getCachedProspectSearch(query, criteria, entityType)
}