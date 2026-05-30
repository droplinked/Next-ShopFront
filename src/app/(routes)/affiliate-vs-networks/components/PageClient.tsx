'use client';

import { useState } from 'react';
import type {
  CalculateInput,
  CalculateOutput,
} from '@/lib/cost-comparator/types';
import type { CopyVariant } from '@/lib/cost-comparator/copy-variants';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import CostComparatorCalculator from './CostComparatorCalculator';
import LeadCaptureForm from './LeadCaptureForm';
import FeatureComparison from './FeatureComparison';
import CallToActionFooter from './CallToActionFooter';

/**
 * Client-side wrapper that owns the cross-component state: the
 * calculator's output is needed by the lead-capture form so the BD
 * pipeline gets the exact numbers the merchant saw.
 *
 * Hero is server-rendered (above), passed in as `<Hero />`-equivalent
 * children. Everything below the fold is here so the React tree owns
 * the prefill bridge in one place.
 */
interface PageClientProps {
  variant: CopyVariant;
}

const PageClient = ({ variant }: PageClientProps) => {
  const [calc, setCalc] = useState<{
    input: CalculateInput;
    output: CalculateOutput;
  } | null>(null);

  return (
    <div className={cn(app_vertical, 'w-full gap-4')}>
      <CostComparatorCalculator
        variant={variant}
        onResult={(input, output) => setCalc({ input, output })}
      />
      <FeatureComparison variant={variant} />
      <CallToActionFooter variant={variant} leadCaptureHref="#lead-capture" />
      <LeadCaptureForm variant={variant} prefill={calc} />
    </div>
  );
};

export default PageClient;
