/**
 * MerchantHero — server-rendered merchant branding section.
 *
 * Renders differently based on verifiedTier:
 *   full           → logo + name + description + storefront CTA
 *   directory_only → minimal name + "View storefront" link only
 */

import Image from "next/image";
import type { DiscoveryProfile } from "../lib/discovery-profile";

interface MerchantHeroProps {
  profile: DiscoveryProfile;
}

export default function MerchantHero({ profile }: MerchantHeroProps) {
  const { name, description, logoUrl, storefrontUrl, verifiedTier } = profile;
  const isFull = verifiedTier === "full";

  return (
    <section
      className="bg-surface-1 border-b border-line py-12 px-6 md:px-12"
      aria-label={`${name} merchant profile header`}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Logo — shown for full tier only */}
        {isFull && logoUrl && (
          <div className="flex-shrink-0">
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={80}
              height={80}
              className="rounded-md object-contain bg-surface-2"
              unoptimized={logoUrl.startsWith("http")}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 flex-1">
          {/* Merchant name */}
          <h1 className="text-2xl md:text-3xl font-semibold text-ink font-display">
            {name}
          </h1>

          {/* Description — full tier only */}
          {isFull && description && (
            <p className="text-ink-muted text-base leading-relaxed max-w-2xl">
              {description}
            </p>
          )}

          {/* Verified badge */}
          {isFull && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-mint-500 bg-mint-50/10 border border-mint-500/20 px-2.5 py-1 rounded-sm w-fit">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 3L4.75 8.25L2 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Verified on droplinked
            </span>
          )}

          {/* Storefront CTA */}
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-mint-500 hover:text-mint-400 transition-colors w-fit"
            aria-label={`Visit ${name} storefront`}
          >
            {isFull ? "Shop now" : "View storefront"}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
