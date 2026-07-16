'use client';

/**
 * Accordion — hairline-bordered disclosure rows (premium PDP).
 *
 * The Bloomingdale's-style details pattern: content lives behind quiet,
 * full-width rows with a chevron — the page stays scannable and the buy
 * column keeps its visual weight. Server components pass children in, so
 * accordion CONTENT still server-renders (crawlers and agents read it in the
 * HTML; only the open/close toggle is client behavior).
 */

import { useState, type ReactNode } from 'react';

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900">
          {title}
        </span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path
            d="M3 6l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {/* Keep content mounted (SEO/agents read it; toggle is display-only). */}
      <div className={open ? 'pb-5' : 'hidden'}>{children}</div>
    </div>
  );
}

export default function Accordion({ children }: { children: ReactNode }) {
  return <div className="border-t border-neutral-200">{children}</div>;
}
