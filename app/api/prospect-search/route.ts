import { logger } from '@/lib/utils/logger'
import Exa from 'exa-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
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