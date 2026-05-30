'use client';

import { useState } from 'react';
import type { IPublisherInvitationTermsPreview } from '@/types/interfaces/publisher/invitation';

interface ITermsPreviewProps {
  terms?: IPublisherInvitationTermsPreview;
  merchantName: string;
}

const TermsPreview = ({ terms, merchantName }: ITermsPreviewProps) => {
  const [open, setOpen] = useState(false);
  if (!terms || (!terms.summary && !terms.url)) return null;

  return (
    <section className="w-full px-6 py-8 bg-white">
      <div className="max-w-5xl mx-auto rounded-xl border border-black/10 p-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={open}
          aria-controls="terms-content"
        >
          <span className="font-semibold text-black">
            {merchantName} program terms
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--mt-primary)' }}
          >
            {open ? 'Hide' : 'Preview'}
          </span>
        </button>
        {open && (
          <div id="terms-content" className="mt-4 text-sm text-black/70 leading-relaxed">
            {terms.summary && <p className="whitespace-pre-line">{terms.summary}</p>}
            {terms.url && (
              <p className="mt-3">
                <a
                  href={terms.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--mt-primary)' }}
                >
                  Read the full terms
                </a>
                {terms.revisedAt && (
                  <span className="ml-2 text-black/50">
                    (revised {new Date(terms.revisedAt).toLocaleDateString()})
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TermsPreview;
