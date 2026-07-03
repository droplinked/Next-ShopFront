import { SITE } from "@/lib/site";
import React from "react";

/**
 * Shared shell for the server-rendered policy / legal pages
 * (shipping, returns, privacy, terms, contact, about).
 *
 * Public, no auth, no client gate — a crawler or marketplace reviewer must
 * be able to read the full policy text on first request. Content is passed
 * as children so each page owns its copy while sharing one consistent
 * layout, heading, and business-identity footer line. Semantic <h1>/<h2>
 * elements are used so the trust content is machine-readable.
 */
export default function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  /** Human "last updated" label, e.g. "July 2026". */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 md:px-8">
      <header className="mb-10 flex flex-col gap-3 border-b pb-6">
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        {intro && <p className="text-base text-foreground/60">{intro}</p>}
        {updated && (
          <p className="text-xs text-foreground/40">Last updated: {updated}</p>
        )}
      </header>

      <article className="flex flex-col gap-6 leading-relaxed text-foreground/80">
        {children}
      </article>

      <footer className="mt-14 border-t pt-6">
        <p className="text-sm text-foreground/50">
          Questions about this policy? Contact {SITE.name} at{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

/** Section heading + body helper for consistent policy-page typography. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <div className="flex flex-col gap-2 text-foreground/75">{children}</div>
    </section>
  );
}
