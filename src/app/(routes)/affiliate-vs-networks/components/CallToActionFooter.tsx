import AppTypography from '@/components/ui/typography/AppTypography';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import {
  CTA_FOOTER_COPY,
  type CopyVariant,
} from '@/lib/cost-comparator/copy-variants';

/**
 * Standalone "go talk to us" band that sits between the comparison
 * table and the lead-capture form. Server component — no interaction
 * itself, just an anchor link to scroll into the lead-capture form.
 */
interface CallToActionFooterProps {
  variant: CopyVariant;
  leadCaptureHref: string;
}

const CallToActionFooter = ({
  variant,
  leadCaptureHref,
}: CallToActionFooterProps) => {
  const copy = CTA_FOOTER_COPY[variant];
  return (
    <section
      className={cn(
        app_vertical,
        'w-full gap-4 text-center px-6 py-12 md:py-16',
        'bg-gray-100 dark:bg-gray-1000',
      )}
      data-testid="cc-cta-footer"
    >
      <AppTypography appClassName="text-2xl md:text-4xl font-bold">
        {copy.headline}
      </AppTypography>
      <AppTypography appClassName="text-base text-gray-500 max-w-2xl">
        {copy.subline}
      </AppTypography>
      <a
        href={leadCaptureHref}
        className={cn(
          'inline-flex items-center justify-center px-6 py-3 rounded-lg mt-2',
          'bg-foreground text-background font-medium',
          'hover:bg-hovered hover:text-hovered-foreground transition-colors',
        )}
      >
        {copy.ctaLabel}
      </a>
    </section>
  );
};

export default CallToActionFooter;
