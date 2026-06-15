/**
 * loading.tsx — skeleton shown while the SSR page fetches the
 * discovery profile from apiv3. ISR-cached responses will rarely
 * trigger this; it fires on first-hit cold start only.
 */

export default function MerchantPageLoading() {
  return (
    <div className="min-h-screen bg-surface animate-pulse" aria-busy="true" aria-label="Loading merchant profile">
      {/* Hero skeleton */}
      <div className="bg-surface-1 border-b border-line py-12 px-6 md:px-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start gap-6">
          {/* Logo placeholder */}
          <div className="w-20 h-20 rounded-md bg-surface-3 flex-shrink-0" />

          <div className="flex flex-col gap-3 flex-1">
            {/* Name */}
            <div className="h-8 w-48 bg-surface-3 rounded-sm" />
            {/* Description */}
            <div className="h-4 w-full max-w-md bg-surface-3 rounded-sm" />
            <div className="h-4 w-3/4 max-w-sm bg-surface-3 rounded-sm" />
            {/* Badge + CTA */}
            <div className="h-6 w-36 bg-surface-3 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="py-10 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="h-6 w-40 bg-surface-3 rounded-sm mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md overflow-hidden border border-line bg-surface-1"
              >
                <div className="aspect-square bg-surface-3" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-4 w-full bg-surface-3 rounded-sm" />
                  <div className="h-4 w-16 bg-surface-3 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
