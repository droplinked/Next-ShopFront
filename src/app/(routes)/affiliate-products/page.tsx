import { Suspense } from 'react'
type AffiliateProduct = { id: string; title: string; price: { amount: number; currency: string } }
async function fetchProducts(sp: URLSearchParams): Promise<AffiliateProduct[]> {
  try {
    const res = await fetch(`/api/public/products?${sp.toString()}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.data) ? json.data : []
  } catch { return [] }
}
export default async function AffiliateProductsPage({ searchParams }: { searchParams: Promise<{ store?: string; category?: string; q?: string }> }) {
  const p = await searchParams
  const sp = new URLSearchParams({ affiliate: 'true' })
  if (p.store) sp.set('store', p.store)
  if (p.category) sp.set('category', p.category)
  if (p.q) sp.set('q', p.q)
  const products = await fetchProducts(sp)
  return (<main><h1>Affiliate Products</h1><Suspense><ul>{products.map(x => <li key={x.id}>{x.title} — {x.price.amount} {x.price.currency}</li>)}</ul></Suspense></main>)
}
