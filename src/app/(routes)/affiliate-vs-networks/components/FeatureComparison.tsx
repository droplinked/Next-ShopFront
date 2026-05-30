import AppTypography from '@/components/ui/typography/AppTypography';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { NETWORK_PROFILES } from '@/lib/cost-comparator/cost-comparator';
import {
  FEATURE_COMPARISON_COPY,
  type CopyVariant,
} from '@/lib/cost-comparator/copy-variants';

/**
 * Side-by-side comparison table. Server component — values are
 * sourced from `NETWORK_PROFILES`, kept in sync with the rates the
 * backend uses for the calculator math.
 */
interface FeatureComparisonProps {
  variant: CopyVariant;
}

const ROWS: Array<{
  label: string;
  selector: (
    p: (typeof NETWORK_PROFILES)[number],
  ) => string;
}> = [
  {
    label: 'Network take-rate',
    selector: (p) => `${p.takeRatePercent}%`,
  },
  { label: 'Payout cadence', selector: (p) => p.payoutCadence },
  { label: 'Attribution method', selector: (p) => p.attributionMethod },
  { label: 'MENA coverage', selector: (p) => p.menaCoverage },
  { label: 'Lending integration', selector: (p) => p.lendingIntegration },
];

const FeatureComparison = ({ variant }: FeatureComparisonProps) => {
  const copy = FEATURE_COMPARISON_COPY[variant];

  return (
    <section
      id="comparison"
      className={cn(app_vertical, 'w-full max-w-6xl mx-auto gap-6 px-6 py-12')}
      data-testid="cc-feature-comparison"
    >
      <div className={cn(app_vertical, 'gap-2 text-center')}>
        <AppTypography appClassName="text-2xl md:text-4xl font-bold">
          {copy.title}
        </AppTypography>
        <AppTypography appClassName="text-base text-gray-500 max-w-2xl">
          {copy.subtitle}
        </AppTypography>
      </div>

      <div className="w-full overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          aria-label="Feature comparison: droplinked vs affiliate networks"
        >
          <thead>
            <tr>
              <th className="text-left p-3 border-b border-secondary font-medium text-gray-500">
                Dimension
              </th>
              {NETWORK_PROFILES.map((profile) => (
                <th
                  key={profile.id}
                  className={cn(
                    'text-left p-3 border-b border-secondary font-medium',
                    profile.id === 'droplinked' && 'text-foreground font-bold',
                  )}
                  scope="col"
                >
                  {profile.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-secondary/50">
                <th
                  className="text-left p-3 font-medium text-gray-500"
                  scope="row"
                >
                  {row.label}
                </th>
                {NETWORK_PROFILES.map((profile) => (
                  <td
                    key={profile.id}
                    className={cn(
                      'p-3 align-top',
                      profile.id === 'droplinked' && 'font-medium',
                    )}
                    data-testid={`cc-cell-${profile.id}-${row.label
                      .replace(/[^a-z0-9]/gi, '-')
                      .toLowerCase()}`}
                  >
                    {row.selector(profile)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default FeatureComparison;
