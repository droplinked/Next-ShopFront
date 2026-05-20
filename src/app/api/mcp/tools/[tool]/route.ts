import { NextResponse } from 'next/server'
import { fetchInstance } from '@/lib/fetchInstance'
type Input = Record<string, unknown>
async function listProducts(i: Input) { const sp = new URLSearchParams({ affiliate: 'true' }); for (const k of ['store','category','q'] as const) if (typeof i[k]==='string') sp.set(k, i[k] as string); return fetchInstance(`products?${sp.toString()}`) }
async function getProduct(i: Input) { return typeof i.id_or_slug === 'string' ? fetchInstance(`products/${encodeURIComponent(i.id_or_slug)}`) : { error: 'id_or_slug required' } }
async function getAffiliateLink(i: Input) { return (typeof i.product_id==='string' && typeof i.affiliate_code==='string') ? { url: `https://droplinked.com/p/${encodeURIComponent(i.product_id)}?aff=${encodeURIComponent(i.affiliate_code)}` } : { error: 'product_id + affiliate_code required' } }
const TOOLS: Record<string, (i: Input) => Promise<unknown>> = { list_products: listProducts, get_product: getProduct, get_affiliate_link: getAffiliateLink }
export async function POST(request: Request, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  const handler = TOOLS[tool]
  if (!handler) return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 404 })
  let input: Input = {}
  try { input = await request.json() } catch { /* empty */ }
  try { return NextResponse.json({ tool, data: await handler(input) }) }
  catch (e) { return NextResponse.json({ tool, error: e instanceof Error ? e.message : 'tool failed' }, { status: 500 }) }
}
