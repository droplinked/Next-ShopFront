import { Suspense } from 'react'
import type { Metadata } from 'next'

/**
 * Public affiliate-product listing — path-agnostic scaffold.
 *
 * Sidekick's /<storename>/ URL framework hasn't landed yet, so this route is
 * mounted directly under (routes) without a store prefix. Once the framework
 * lands the page can be relocated under the dynamic [store] segment without
 * touching the component — the `store` searchParam already drives the query.
 *
 * Backend contract: apiv3 PR #1278 → GET /products/public proxied via
 * /api/public/products. We pass `affiliate=true` so apiv3 returns the
 * commission-eligible subset.
 */

type AffiliateProduct = {
  id: string
  title: string
  slug?: string
  image?: string
  price: { amount: number; currency: string }
  commission?: { percentage?: number; amount?: number; currency?: string }
  category?: string
}

type ListResponse = {
  data: AffiliateProduct[]
  page?: number
  totalPages?: number
  total?: number
  categories?: string[]
}

// Product `category` enum as known to the public products endpoint. Mirrors
// the apiv3 schema; keep this in sync if backend adds categories.
const KNOWN_CATEGORIES = [
  'apparel',
  'accessories',
  'home',
  'beauty',
  'electronics',
  'collectibles',
  'digital',
  'other',
] as const

type SearchParamsShape = {
  store?: string
  category?: string
  q?: string
  page?: string
}

function buildQuery(p: SearchParamsShape): URLSearchParams {
  const sp = new URLSearchParams({ affiliate: 'true' })
  if (p.store) sp.set('store', p.store)
  if (p.category) sp.set('category', p.category)
  if (p.q) sp.set('q', p.q)
  if (p.page) sp.set('page', p.page)
  sp.set('limit', '24')
  return sp
}

async function fetchProducts(sp: URLSearchParams, origin: string): Promise<ListResponse> {
  try {
    const res = await fetch(`${origin}/api/public/products?${sp.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return { data: [] }
    const json = await res.json()
    if (Array.isArray(json?.data)) return json as ListResponse
    if (Array.isArray(json)) return { data: json }
    return { data: [] }
  } catch {
    return { data: [] }
  }
}

function getOrigin(): string {
  // Support SSR fetch in dev + prod. Server-side fetch requires absolute URL.
  const envOrigin = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL
  if (envOrigin) return envOrigin.replace(/\/$/, '')
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>
}): Promise<Metadata> {
  const p = await searchParams
  const storeLabel = p.store ? ` from ${p.store}` : ''
  const titleBase = `Affiliate products${storeLabel}`
  return {
    title: titleBase,
    description: `Discover affiliate-ready products${storeLabel} on Droplinked. Earn commissions by sharing.`,
    openGraph: { title: titleBase, type: 'website' },
  }
}

function ProductCard({ product }: { product: AffiliateProduct }) {
  const commissionPct = product.commission?.percentage
  return (
    <li className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {product.image ? (
          // Using <img> intentionally — public product images come from arbitrary
          // merchant origins and we don't want to widen next/image remotePatterns
          // for an MVP listing.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
        {typeof commissionPct === 'number' && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white shadow">
            {commissionPct}% commission
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {product.title}
        </h3>
        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {product.price.amount}
          </span>
          <span className="text-xs uppercase text-neutral-500">{product.price.currency}</span>
        </div>
      </div>
    </li>
  )
}

function EmptyState({ q }: { q?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
      <p className="text-base font-medium text-neutral-700 dark:text-neutral-200">
        No affiliate products found
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        {q
          ? `Nothing matched "${q}". Try a broader search or clear filters.`
          : 'Check back soon — merchants add affiliate-ready products often.'}
      </p>
    </div>
  )
}

function Skeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="aspect-[3/4] animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
        />
      ))}
    </ul>
  )
}

async function ProductsGrid({ params }: { params: SearchParamsShape }) {
  const sp = buildQuery(params)
  const origin = getOrigin()
  const { data, page = 1, totalPages = 1 } = await fetchProducts(sp, origin)

  if (data.length === 0) return <EmptyState q={params.q} />

  // Preserve current filters across pagination links.
  const linkParams = new URLSearchParams()
  if (params.store) linkParams.set('store', params.store)
  if (params.category) linkParams.set('category', params.category)
  if (params.q) linkParams.set('q', params.q)
  const prevPage = Math.max(1, page - 1)
  const nextPage = page + 1
  const prevHref = `?${(() => { const x = new URLSearchParams(linkParams); x.set('page', String(prevPage)); return x.toString() })()}`
  const nextHref = `?${(() => { const x = new URLSearchParams(linkParams); x.set('page', String(nextPage)); return x.toString() })()}`

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
      <nav
        aria-label="Pagination"
        className="mt-6 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300"
      >
        <a
          href={prevHref}
          aria-disabled={page <= 1}
          className={`rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700 ${
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          Previous
        </a>
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <a
          href={nextHref}
          aria-disabled={page >= totalPages}
          className={`rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700 ${
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          Next
        </a>
      </nav>
    </>
  )
}

export default async function AffiliateProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>
}) {
  const params = await searchParams

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        {/* Sentence-case D1 per UXUI doc. */}
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 sm:text-3xl">
          Affiliate products
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Earn commissions by sharing these products.
        </p>
      </header>

      <form
        method="GET"
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        role="search"
      >
        {params.store && <input type="hidden" name="store" value={params.store} />}
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search products"
          aria-label="Search products"
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select
          name="category"
          defaultValue={params.category ?? ''}
          aria-label="Filter by category"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">All categories</option>
          {KNOWN_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          Apply
        </button>
      </form>

      <Suspense fallback={<Skeleton />}>
        <ProductsGrid params={params} />
      </Suspense>
    </main>
  )
}
