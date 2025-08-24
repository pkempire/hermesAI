import Exa from 'exa-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { criteria, enrichments, entityType = 'person', count = 25 } = await req.json();
    const exa = new Exa(process.env.EXA_API_KEY!);
    // Compose search config
    const searchConfig = {
      query: criteria.map((c: any) => c.label).join(' '),
      count,
      entity: entityType === 'company' ? { type: 'company' as const } : { type: 'person' as const },
      criteria: criteria.map((c: any) => ({ description: c.label, successRate: 70 }))
    };
    const enrichmentsConfig = enrichments.map((e: any) => ({
      description: e.label,
      format: 'text' as const,
      title: e.label
    }));
    console.log('[POST /api/prospect-search] searchConfig:', searchConfig);
    console.log('[POST /api/prospect-search] enrichmentsConfig:', enrichmentsConfig);
    const webset = await exa.websets.create({
      search: searchConfig,
      enrichments: enrichmentsConfig
    });
    return NextResponse.json({ websetId: webset.id });
  } catch (err: any) {
    console.error('[POST /api/prospect-search] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 