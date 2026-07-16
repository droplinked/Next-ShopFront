'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppButton from '@/components/ui/button/AppButton';

interface Confirmation {
  sessionId: string;
  orderId: string | null;
  status: string;
  productId: string;
  productTitle: string | null;
  quantity: number;
  amountTotal: number;
  currency: string;
  shopId: string;
}

type ViewState = 'loading' | 'ready' | 'error';

const MAX_POLLS = 12; // ~18s — covers the Stripe webhook → order-record race
const POLL_INTERVAL_MS = 1500;

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount} ${(currency || '').toUpperCase()}`;
  }
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="container px-6 md:px-8 flex items-center justify-center w-full min-h-[70vh] py-16">
          <span
            className="h-10 w-10 rounded-full border-[3px] border-mint/30 border-t-mint animate-spin"
            role="status"
            aria-label="Loading"
          />
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [state, setState] = useState<ViewState>('loading');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(
          `/api/mor-checkout/confirmation/${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' },
        );
        if (res.ok) {
          const json = await res.json();
          const data: Confirmation | undefined = json?.data ?? json;
          if (data && data.productId && !cancelled) {
            setConfirmation(data);
            setState('ready');
            return;
          }
        }
      } catch {
        // fall through to retry / give up
      }
      if (cancelled) return;
      if (attempts < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        setState('error');
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="container px-6 md:px-8 flex flex-col items-center justify-center w-full min-h-[70vh] py-16">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white shadow-sm p-8 md:p-10 text-center dark:bg-neutral-900 dark:border-white/10">
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-5" aria-live="polite">
            <span
              className="h-10 w-10 rounded-full border-[3px] border-mint/30 border-t-mint animate-spin"
              role="status"
              aria-label="Confirming your order"
            />
            <p className="text-base text-neutral-600 dark:text-neutral-300">
              Confirming your order…
            </p>
          </div>
        )}

        {state === 'ready' && confirmation && (
          <div className="flex flex-col items-center gap-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-50 text-mint">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Thank you — your order is confirmed
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                A receipt is on its way to your email.
              </p>
            </div>

            <dl className="w-full divide-y divide-black/5 rounded-xl bg-neutral-50 px-4 dark:bg-neutral-800/60 dark:divide-white/5">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400 text-left">
                  {confirmation.productTitle ?? 'Item'}
                  {confirmation.quantity > 1 ? ` × ${confirmation.quantity}` : ''}
                </dt>
                <dd className="text-sm font-medium text-neutral-900 tabular-nums dark:text-white">
                  {formatAmount(confirmation.amountTotal, confirmation.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">Total paid</dt>
                <dd className="text-base font-semibold text-neutral-900 tabular-nums dark:text-white">
                  {formatAmount(confirmation.amountTotal, confirmation.currency)}
                </dd>
              </div>
              {confirmation.orderId && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">Order</dt>
                  <dd className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    #{confirmation.orderId.slice(-8)}
                  </dd>
                </div>
              )}
            </dl>

            <Link href="/" className="w-full">
              <AppButton appVariant="filled" appClassName="rounded-sm w-full">
                Continue shopping
              </AppButton>
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Your payment went through
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                We couldn&apos;t load your order details just yet, but your
                payment was successful — a receipt will arrive by email shortly.
              </p>
            </div>
            <Link href="/" className="w-full">
              <AppButton appVariant="filled" appClassName="rounded-sm w-full">
                Continue shopping
              </AppButton>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
