'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import AppButton from '@/components/ui/button/AppButton';
import AppInput from '@/components/ui/input/text/AppInput';
import AppTypography from '@/components/ui/typography/AppTypography';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { validateLeadCaptureInput } from '@/lib/cost-comparator/cost-comparator';
import { CTA_FOOTER_COPY, type CopyVariant } from '@/lib/cost-comparator/copy-variants';
import {
  trackLeadCaptureConversion,
  trackLeadCaptureSubmit,
} from '@/lib/cost-comparator/analytics';
import type {
  CalculateInput,
  CalculateOutput,
} from '@/lib/cost-comparator/types';
import { leadCaptureService } from '@/services/cost-comparator/service';

interface LeadCaptureFormProps {
  variant: CopyVariant;
  /** Calculator output reused by this form so we can re-submit the
   * same calc input (the backend re-computes savings server-side). */
  prefill?: { input: CalculateInput; output: CalculateOutput } | null;
}

interface FormState {
  merchantEmail: string;
  merchantName: string;
  verticalHint: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  merchantEmail: '',
  merchantName: '',
  verticalHint: '',
  notes: '',
};

const LeadCaptureForm = ({ variant, prefill }: LeadCaptureFormProps) => {
  const copy = CTA_FOOTER_COPY[variant];
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prefill) {
      setError('Run the calculator above first so we can attach your numbers.');
      return;
    }

    const validationError = validateLeadCaptureInput({
      merchantEmail: form.merchantEmail,
      merchantName: form.merchantName,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      trackLeadCaptureSubmit({
        currentNetwork: prefill.input.currentNetwork,
        annualSpendUsd: prefill.input.annualSpendUsd,
        verticalHint: form.verticalHint || undefined,
        utmSource: readUtmSource(),
      });
      await leadCaptureService({
        merchantEmail: form.merchantEmail.trim().toLowerCase(),
        merchantName: form.merchantName.trim(),
        calcInput: prefill.input,
        verticalHint: form.verticalHint.trim() || undefined,
        utmSource: readUtmSource(),
        notes: form.notes.trim() || undefined,
      });
      trackLeadCaptureConversion({
        currentNetwork: prefill.input.currentNetwork,
        savingsAnnualUsd: prefill.output.savingsAnnualUsd,
        annualSpendUsd: prefill.input.annualSpendUsd,
      });
      setSubmitted(true);
      toast.success('Thanks — we will be in touch within one business day.');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Submission failed. Try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section
        id="lead-capture"
        className={cn(
          app_vertical,
          'w-full max-w-2xl mx-auto gap-4 px-6 py-12 text-center',
        )}
        data-testid="cc-lead-success"
      >
        <AppTypography appClassName="text-2xl md:text-3xl font-bold">
          We have your numbers.
        </AppTypography>
        <AppTypography appClassName="text-base text-gray-500">
          A migration specialist will reach out within one business day with a
          tailored defection plan.
        </AppTypography>
      </section>
    );
  }

  return (
    <section
      id="lead-capture"
      className={cn(
        app_vertical,
        'w-full max-w-2xl mx-auto gap-6 px-6 py-12',
      )}
      data-testid="cc-lead-capture"
    >
      <div className={cn(app_vertical, 'gap-2 text-center')}>
        <AppTypography appClassName="text-2xl md:text-4xl font-bold">
          {copy.headline}
        </AppTypography>
        <AppTypography appClassName="text-base text-gray-500">
          {copy.subline}
        </AppTypography>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          app_vertical,
          'w-full gap-4 p-6 md:p-8 rounded-lg border border-secondary bg-background',
        )}
      >
        <AppInput
          label="Work email"
          placeholder="cfo@brand.example.com"
          inputType="email"
          value={form.merchantEmail}
          onChange={update('merchantEmail')}
          data-testid="cc-lead-email"
          required
        />
        <AppInput
          label="Business name"
          placeholder="Acme Brand Co"
          value={form.merchantName}
          onChange={update('merchantName')}
          data-testid="cc-lead-name"
          required
        />
        <AppInput
          label="Vertical (optional)"
          placeholder="apparel / beauty / electronics / …"
          value={form.verticalHint}
          onChange={update('verticalHint')}
          data-testid="cc-lead-vertical"
        />
        <label className="flex flex-col gap-2 w-full">
          <AppTypography appClassName="font-normal text-sm">
            Anything we should know? (optional)
          </AppTypography>
          <textarea
            className={cn(
              'border border-secondary rounded-sm p-3 bg-transparent text-sm',
              'focus:outline-none focus:ring-0 min-h-[80px]',
            )}
            value={form.notes}
            onChange={update('notes')}
            data-testid="cc-lead-notes"
            placeholder="Current network contract end-date, top publishers, target migration window…"
            maxLength={2000}
          />
        </label>
        {error && (
          <AppTypography
            appClassName="text-sm text-destructive"
            data-testid="cc-lead-error"
          >
            {error}
          </AppTypography>
        )}
        <AppButton
          type="submit"
          appSize="lg"
          loading={loading}
          disabled={loading}
          data-testid="cc-lead-submit"
        >
          {copy.ctaLabel}
        </AppButton>
        <AppTypography appClassName="text-xs text-gray-500 text-center">
          We will only use your email to send a migration plan.
        </AppTypography>
      </form>
    </section>
  );
};

export default LeadCaptureForm;

/** Reads `?utm_source=` from the current URL. Safe on SSR (returns undefined). */
function readUtmSource(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('utm_source');
    return v ?? undefined;
  } catch {
    return undefined;
  }
}
