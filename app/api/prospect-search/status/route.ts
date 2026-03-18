import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use POST /api/prospect-search/execute and GET /api/prospect-search/stream instead.'
    },
    { status: 410 }
  )
}
