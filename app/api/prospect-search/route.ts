import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      type: 'prospect_search_error',
      event: 'error',
      message: 'Deprecated endpoint. Use POST /api/prospect-search/execute and GET /api/prospect-search/stream.'
    },
    { status: 410 }
  )
}
