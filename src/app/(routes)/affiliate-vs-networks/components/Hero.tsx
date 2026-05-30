import AppTypography from '@/components/ui/typography/AppTypography';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import type { CopyVariant } from '@/lib/cost-comparator/copy-variants';
import { HERO_COPY } from '@/lib/cost-comparator/copy-variants';

/**
 * Top-of-page hero. Server component — copy is resolved at request
 * time so the operator's `NEXT_PUBLIC_COST_COMPARATOR_COPY_VARIANT`
 * flip takes effect on next render without redeploying components.
 */
interface HeroProps {
  variant: CopyVariant;
  onPrimaryCtaHref: string;
  onSecondaryCtaHref: string;
}

const Hero = ({ variant, onPrimaryCtaHref, onSecondaryCtaHref }: HeroProps) => {
  const copy = HERO_COPY[variant];

  return (
    <section
      className={cn(
        app_vertical,
        'w-full text-center gap-6 py-16 md:py-24 px-6',
      )}
      data-testid="cc-hero"
    >
      <AppTypography
        appClassName="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl"
      >
        {copy.headline}
      </AppTypography>
      <AppTypography
        appClassName="text-base md:text-xl text-gray-500 max-w-2xl"
      >
        {copy.tagline}
      </AppTypography>
      <div
        className={cn(
          'flex flex-col sm:flex-row items-center justify-center gap-3 pt-4',
        )}
      >
        <a
          href={onPrimaryCtaHref}
          className={cn(
            'inline-flex items-center justify-center px-6 py-3 rounded-lg',
            'bg-foreground text-background font-medium',
            'hover:bg-hovered hover:text-hovered-foreground transition-colors',
          )}
          data-testid="cc-hero-cta-primary"
        >
          {copy.ctaPrimary}
        </a>
        <a
          href={onSecondaryCtaHref}
          className={cn(
            'inline-flex items-center justify-center px-6 py-3 rounded-lg',
            'border border-foreground text-foreground bg-transparent',
            'hover:bg-hovered-outlined/10 transition-colors',
          )}
          data-testid="cc-hero-cta-secondary"
        >
          {copy.ctaSecondary}
        </a>
      </div>
    </section>
  );
};

export default Hero;
