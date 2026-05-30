'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import AppButton from '@/components/ui/button/AppButton';
import AppInput from '@/components/ui/input/text/AppInput';
import AppTypography from '@/components/ui/typography/AppTypography';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import {
  buildCalculatorPayload,
  formatSpeedMultiplier,
  formatUsd,
  formatUsdShort,
  networkDisplayName,
  SUPPORTED_NETWORKS,
  validateCalculatorInput,
} from '@/lib/cost-comparator/cost-comparator';
import {
  CALCULATOR_COPY,
  type CopyVariant,
} from '@/lib/cost-comparator/copy-variants';
import {
  trackCalculatorResult,
  trackCalculatorSubmit,
} from '@/lib/cost-comparator/analytics';
import type {
  CalculateInput,
  CalculateOutput,
  SupportedNetwork,
} from '@/lib/cost-comparator/types';
import { calculateService } from '@/services/cost-comparator/service';

interface CalculatorProps {
  variant: CopyVariant;
  /** Optional callback so the parent page can prefill the lead-capture form. */
  onResult?: (input: CalculateInput, output: CalculateOutput) => void;
}

interface FormState {
  currentNetwork: SupportedNetwork | '';
  annualSpendUsd: string;
  avgCommissionRate: string;
  monthlyTxCount: string;
}

const INITIAL_FORM: FormState = {
  currentNetwork: '',
  annualSpendUsd: '',
  avgCommissionRate: '',
  monthlyTxCount: '',
};

const CostComparatorCalculator = ({ variant, onResult }: CalculatorProps) => {
  const copy = CALCULATOR_COPY[variant];

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<CalculateOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateCalculatorInput({
      currentNetwork: form.currentNetwork,
      annualSpendUsd: form.annualSpendUsd,
      avgCommissionRate: form.avgCommissionRate,
      monthlyTxCount: form.monthlyTxCount,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = buildCalculatorPayload({
      currentNetwork: form.currentNetwork,
      annualSpendUsd: form.annualSpendUsd,
      avgCommissionRate: form.avgCommissionRate,
      monthlyTxCount: form.monthlyTxCount,
    }) as unknown as CalculateInput;

    setLoading(true);
    try {
      trackCalculatorSubmit({
        currentNetwork: payload.currentNetwork,
        annualSpendUsd: payload.annualSpendUsd,
      });
      const output = await calculateService(payload);
      setResult(output);
      trackCalculatorResult({
        currentNetwork: output.currentNetwork,
        savingsAnnualUsd: output.savingsAnnualUsd,
        annualSpendUsd: output.annualSpendUsd,
      });
      onResult?.(payload, output);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Calculation failed. Try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="calculator"
      className={cn(
        app_vertical,
        'w-full max-w-5xl mx-auto gap-8 px-6 py-12',
      )}
      data-testid="cc-calculator"
    >
      <div className={cn(app_vertical, 'gap-2 text-center')}>
        <AppTypography appClassName="text-2xl md:text-4xl font-bold">
          {copy.title}
        </AppTypography>
        <AppTypography appClassName="text-base text-gray-500 max-w-2xl">
          {copy.subtitle}
        </AppTypography>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          'w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-6 md:p-8',
          'rounded-lg border border-secondary bg-background',
        )}
      >
        <label className="flex flex-col gap-2 w-full">
          <AppTypography appClassName="font-normal text-sm">
            Current network
          </AppTypography>
          <select
            value={form.currentNetwork}
            onChange={update('currentNetwork')}
            className={cn(
              'border border-secondary rounded-sm p-3 bg-transparent text-sm',
              'focus:outline-none focus:ring-0',
            )}
            data-testid="cc-input-network"
            aria-label="Current affiliate network"
          >
            <option value="" disabled>
              Pick your network
            </option>
            {SUPPORTED_NETWORKS.map((n) => (
              <option key={n} value={n}>
                {networkDisplayName(n)}
              </option>
            ))}
          </select>
        </label>

        <AppInput
          label="Annual affiliate spend (USD)"
          placeholder="e.g. 1000000"
          inputType="number"
          value={form.annualSpendUsd}
          onChange={update('annualSpendUsd')}
          data-testid="cc-input-spend"
          min={0}
        />

        <AppInput
          label="Avg commission rate (0–1, optional)"
          placeholder="e.g. 0.10 for 10%"
          inputType="number"
          value={form.avgCommissionRate}
          onChange={update('avgCommissionRate')}
          data-testid="cc-input-commission"
          step={0.01}
          min={0}
          max={1}
        />

        <AppInput
          label="Monthly transactions (optional)"
          placeholder="e.g. 1500"
          inputType="number"
          value={form.monthlyTxCount}
          onChange={update('monthlyTxCount')}
          data-testid="cc-input-tx"
          min={0}
        />

        <div className="md:col-span-2 flex flex-col items-stretch gap-3 pt-2">
          {error && (
            <AppTypography
              appClassName="text-sm text-destructive"
              data-testid="cc-error"
            >
              {error}
            </AppTypography>
          )}
          <AppButton
            type="submit"
            appSize="lg"
            loading={loading}
            disabled={loading}
            data-testid="cc-submit"
          >
            {copy.submitLabel}
          </AppButton>
        </div>
      </form>

      {result && <CalculatorResult result={result} variant={variant} />}
    </section>
  );
};

export default CostComparatorCalculator;

interface CalculatorResultProps {
  result: CalculateOutput;
  variant: CopyVariant;
}

const CalculatorResult = ({ result, variant }: CalculatorResultProps) => {
  const copy = CALCULATOR_COPY[variant];

  return (
    <div
      className={cn(
        app_vertical,
        'w-full gap-6 p-6 md:p-8 rounded-lg border border-secondary bg-background',
      )}
      data-testid="cc-result"
      role="region"
      aria-live="polite"
      aria-label="Cost comparator result"
    >
      <AppTypography appClassName="text-xl md:text-2xl font-bold text-center">
        {copy.resultHeadline(result.savingsAnnualUsd)}
      </AppTypography>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <Stat
          label="Annual savings"
          value={formatUsd(result.savingsAnnualUsd)}
          testId="cc-stat-annual"
        />
        <Stat
          label="3-year savings"
          value={formatUsd(result.savings3YearUsd)}
          testId="cc-stat-3yr"
        />
        <Stat
          label="USDC payouts vs NET-30"
          value={`${formatSpeedMultiplier(
            result.payoutSpeedComparison.speedMultiplier,
          )} faster`}
          testId="cc-stat-speed"
        />
      </div>

      <CostBreakdown result={result} />
      <MonthlyProjectionChart result={result} />
    </div>
  );
};

interface StatProps {
  label: string;
  value: string;
  testId: string;
}

const Stat = ({ label, value, testId }: StatProps) => (
  <div
    className={cn(
      app_vertical,
      'gap-1 p-4 rounded-sm border border-secondary text-center',
    )}
  >
    <AppTypography appClassName="text-xs text-gray-500 uppercase tracking-wider">
      {label}
    </AppTypography>
    <AppTypography appClassName="text-xl md:text-2xl font-bold" data-testid={testId}>
      {value}
    </AppTypography>
  </div>
);

const CostBreakdown = ({ result }: { result: CalculateOutput }) => (
  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
    <BreakdownRow
      title={`Current cost (${networkDisplayName(result.currentNetwork)})`}
      commission={result.annualSpendUsd}
      fee={result.networkFeeAnnualUsd}
      feeLabel={`Network take (${Math.round(result.networkTakeRate * 100)}%)`}
      total={result.currentTotalAnnualUsd}
      negative
    />
    <BreakdownRow
      title="Cost with droplinked"
      commission={result.annualSpendUsd}
      fee={result.droplinkedFeeAnnualUsd}
      feeLabel={`droplinked fee (${(result.droplinkedFeeRate * 100).toFixed(1)}%)`}
      total={result.droplinkedTotalAnnualUsd}
    />
  </div>
);

interface BreakdownRowProps {
  title: string;
  commission: number;
  fee: number;
  feeLabel: string;
  total: number;
  negative?: boolean;
}

const BreakdownRow = ({
  title,
  commission,
  fee,
  feeLabel,
  total,
  negative = false,
}: BreakdownRowProps) => (
  <div
    className={cn(
      'p-4 rounded-sm border',
      negative ? 'border-destructive/40' : 'border-secondary',
    )}
  >
    <AppTypography appClassName="text-sm font-medium mb-3">
      {title}
    </AppTypography>
    <dl className="text-sm space-y-1">
      <div className="flex justify-between">
        <dt className="text-gray-500">Commission</dt>
        <dd>{formatUsd(commission)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-gray-500">{feeLabel}</dt>
        <dd>{formatUsd(fee)}</dd>
      </div>
      <div className="flex justify-between pt-2 border-t border-secondary/50 mt-2 font-bold">
        <dt>Total</dt>
        <dd>{formatUsd(total)}</dd>
      </div>
    </dl>
  </div>
);

const MonthlyProjectionChart = ({ result }: { result: CalculateOutput }) => {
  const max = result.projectionMonthly.reduce(
    (acc, cell) => Math.max(acc, cell.cumulativeSavingsUsd),
    0,
  );
  if (max <= 0) return null;
  return (
    <div className="w-full" data-testid="cc-projection-chart">
      <AppTypography appClassName="text-sm font-medium mb-3">
        Cumulative savings (12-month projection)
      </AppTypography>
      <div className="flex items-end gap-1 md:gap-2 h-32 w-full">
        {result.projectionMonthly.map((cell) => {
          const heightPct = Math.max(2, (cell.cumulativeSavingsUsd / max) * 100);
          return (
            <div
              key={cell.month}
              className="flex flex-col items-center justify-end flex-1 h-full"
              title={`Month ${cell.month}: ${formatUsd(cell.cumulativeSavingsUsd)}`}
            >
              <div
                className="w-full bg-foreground rounded-t-sm"
                style={{ height: `${heightPct}%` }}
                aria-label={`Month ${cell.month} cumulative savings ${formatUsdShort(cell.cumulativeSavingsUsd)}`}
              />
              <span className="text-[10px] text-gray-500 mt-1">
                {cell.month}
              </span>
            </div>
          );
        })}
      </div>
      <AppTypography appClassName="text-xs text-gray-500 text-center mt-2">
        Month 12 cumulative: {formatUsdShort(
          result.projectionMonthly[result.projectionMonthly.length - 1]
            ?.cumulativeSavingsUsd ?? 0,
        )}
      </AppTypography>
    </div>
  );
};
