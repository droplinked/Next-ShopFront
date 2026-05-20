import { fetchInstance } from '@/lib/fetchInstance'
import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (!searchParams.has('limit')) searchParams.set('limit', '20')
  if (!searchParams.has('page')) searchParams.set('page', '1')
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  if (limit > 100) searchParams.set('limit', '100')
  searchParams.set('public', 'true')
  try {
    // Backend apiv3 #1278 endpoint: GET /products/public?store=...&limit=...
    const data = await fetchInstance(`products/public?${searchParams.toString()}`)
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'Access-Control-Allow-Origin': '*' } })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'internal error' }, { status: 500 }) }
}
