import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      type: 'prospect_search_error',
      event: 'error',
      message: 'Deprecated endpoint. Use GET /api/prospect-search/stream.'
    },
    { status: 410 }
  )
}
