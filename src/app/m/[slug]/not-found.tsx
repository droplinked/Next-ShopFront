/**
 * not-found.tsx — rendered when fetchDiscoveryProfile returns null
 * (404 slug, 500 BE not yet live, or malformed response).
 *
 * Intentionally minimal — guides users to the main storefront root
 * without orphaned dead-end pages.
 */

import Link from "next/link";

export default function MerchantNotFound() {
  return (
    <main
      className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center"
      aria-label="Merchant not found"
    >
      <span className="text-5xl font-semibold text-ink-muted mb-4 select-none">
        404
      </span>

      <h1 className="text-xl font-semibold text-ink mb-2 font-display">
        Merchant not found
      </h1>

      <p className="text-ink-muted text-sm max-w-xs mb-8">
        This merchant page is not available yet. They may not have opted in to
        the droplinked discovery program.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-mint-500 hover:text-mint-400 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M11.5 7H2.5M2.5 7L6.5 3M2.5 7L6.5 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to home
      </Link>
    </main>
  );
}
