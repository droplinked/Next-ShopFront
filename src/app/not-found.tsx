import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center"
      aria-labelledby="not-found-title"
    >
      <p className="mb-4 select-none text-5xl font-semibold text-foreground/30" aria-hidden="true">
        404
      </p>

      <h1 id="not-found-title" className="mb-2 text-2xl font-semibold text-foreground">
        Page not found
      </h1>

      <p className="mb-8 max-w-md text-sm text-foreground/60">
        The storefront or product you&apos;re looking for may have moved, expired,
        or is not available yet.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-hovered hover:text-hovered-foreground"
        >
          Browse products
        </Link>
        <Link
          href="/contact"
          className="text-sm font-medium text-mint-500 transition-colors hover:text-mint-400"
        >
          Contact support
        </Link>
      </div>
    </main>
  );
}
