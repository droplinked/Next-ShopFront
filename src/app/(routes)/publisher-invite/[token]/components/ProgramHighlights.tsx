import type { IPublisherInvitationProgramPreview } from '@/types/interfaces/publisher/invitation';

interface IProgramHighlightsProps {
  program: IPublisherInvitationProgramPreview;
}

/**
 * Formats a commission rate consistently:
 *   PERCENT  → "12%" (1 decimal max)
 *   FLAT     → "$5 / sale" (or other currency)
 *   unknown  → "Commission TBD"
 */
function formatCommission(program: IPublisherInvitationProgramPreview): string {
  if (program.commissionType === 'FLAT' && typeof program.commissionRate === 'number') {
    const sym = program.commissionCurrency || 'USD';
    return `${sym} ${program.commissionRate.toFixed(2)} / sale`;
  }
  if (program.commissionType === 'PERCENT' && typeof program.commissionRate === 'number') {
    const pct = program.commissionRate <= 1
      ? program.commissionRate * 100
      : program.commissionRate;
    return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
  }
  if (typeof program.commissionRate === 'number') {
    const pct = program.commissionRate <= 1
      ? program.commissionRate * 100
      : program.commissionRate;
    return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
  }
  return 'Commission TBD';
}

const ProgramHighlights = ({ program }: IProgramHighlightsProps) => {
  const stats = [
    {
      label: 'Commission rate',
      value: formatCommission(program),
    },
    {
      label: 'Return window',
      value: typeof program.returnWindowDays === 'number'
        ? `${program.returnWindowDays} days`
        : 'Standard',
    },
    {
      label: 'Payment terms',
      value: program.paymentTerms || (program.settlement
        ? `${program.settlement.asset}${program.settlement.chain ? ' · ' + program.settlement.chain : ''}`
        : 'See terms'),
    },
  ];

  return (
    <section className="w-full px-6 py-10 md:py-14 bg-white">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-black/10 p-6 shadow-sm bg-white"
            style={{ borderTop: '4px solid var(--mt-primary)' }}
          >
            <p className="text-sm text-black/60 uppercase tracking-wide">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-black">{s.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export { formatCommission };
export default ProgramHighlights;
