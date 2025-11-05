import { logger } from '@/lib/utils/logger'
import { checkRateLimit, prospectSearchRateLimit, getRateLimitErrorMessage } from '@/lib/utils/rate-limit'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import Exa from 'exa-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get user ID for rate limiting
    const userId = await getCurrentUserId()
    const rateLimitId = userId || req.ip || 'anonymous'

    // Check rate limit
    const rateLimitResult = await checkRateLimit(rateLimitId, prospectSearchRateLimit)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: getRateLimitErrorMessage('prospect search', rateLimitResult.reset),
          retryAfter: rateLimitResult.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          }
        }
      )
    }

    const { criteria, enrichments, entityType = 'person', count = 25 } = await req.json()
    
    // Validation
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: 'At least one search criterion is required' }, { status: 400 })
    }
    
    const validCount = Math.max(1, Math.min(1000, Math.floor(count || 25)))
    
    const exa = new Exa(process.env.EXA_API_KEY!)
    if (!exa) {
      return NextResponse.json({ error: 'Exa API key not configured' }, { status: 500 })
    }
    
    // Compose search config
    const searchConfig = {
      query: criteria.map((c: any) => c.label || c.value || c).join(' '),
      count: validCount,
      entity: entityType === 'company' ? { type: 'company' as const } : { type: 'person' as const },
      criteria: criteria.slice(0, 5).map((c: any) => ({ 
        description: c.label || c.value || c, 
        successRate: 70 
      }))
    }
    
    const enrichmentsConfig = (enrichments || []).slice(0, 10).map((e: any) => ({
      description: e.label || e.value || e,
      format: 'text' as const,
      title: e.label || e.value || e
    }))
    
    logger.debug('Creating webset:', { 
      query: searchConfig.query.substring(0, 50),
      count: searchConfig.count,
      criteriaCount: searchConfig.criteria.length,
      enrichmentsCount: enrichmentsConfig.length
    })
    
    const webset = await exa.websets.create({
      search: searchConfig,
      enrichments: enrichmentsConfig
    })
    
    return NextResponse.json({ websetId: webset.id })
  } catch (err: any) {
    logger.error('Error creating webset:', err)
    return NextResponse.json({ 
      error: err?.message || 'Failed to create prospect search' 
    }, { status: 500 })
  }
} 