import AppIcons from "@/assets/AppIcons";
import DroplinkedLogo from "@/assets/icons/droplinked-logo.svg";
import { AppSeparator, AppTypography } from "@/components/ui";
import { COMPANY_LINKS, POLICY, POLICY_LINKS, SITE, SITE_ADDRESS_LINE, SOCIAL_LINKS } from "@/lib/site";
import Link from "next/link";
import React from "react";

/**
 * Site-wide footer (rendered on every page via AppLayout).
 *
 * Carries the customer-facing trust surface a marketplace landing-page
 * review looks for: business identity, contact method, and links to the
 * shipping / returns / privacy / terms / contact pages. All hrefs resolve
 * to real server-rendered routes; social links are absolute and verified.
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 flex w-full flex-col gap-8 border-t px-6 py-12 md:px-12 lg:px-24">
      <section className="flex w-full flex-col gap-12 lg:flex-row lg:justify-between">
        {/* Identity + description + socials */}
        <article className="flex w-full max-w-md flex-col gap-6">
          <Link href={SITE.homepage} aria-label={`${SITE.name} home`}>
            <DroplinkedLogo
              aria-label={`${SITE.name} logo`}
              className="h-7 w-auto text-foreground"
            />
          </Link>
          <AppTypography appClassName="text-foreground/50 font-normal text-sm">
            {SITE.description}
          </AppTypography>
          <div className="flex flex-col gap-1">
            <AppTypography appClassName="text-foreground/40 font-normal text-xs uppercase tracking-wide">
              Contact
            </AppTypography>
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              {SITE.supportEmail}
            </a>
            <address className="text-sm not-italic text-foreground/70">
              {SITE_ADDRESS_LINE}
            </address>
          </div>
          <ul className="flex list-none items-center gap-6">
            <li>
              <a href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
                <AppIcons.Glob />
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <AppIcons.Linkedin />
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <AppIcons.Twitter />
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <AppIcons.Instagram />
              </a>
            </li>
          </ul>
        </article>

        {/* Support / policy + company nav */}
        <aside className="flex flex-wrap gap-12 sm:gap-16">
          <nav className="space-y-4">
            <AppTypography appClassName="text-foreground/40 font-normal text-xs uppercase tracking-wide">
              Customer Support
            </AppTypography>
            <ul className="list-none space-y-3">
              {POLICY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="space-y-4">
            <AppTypography appClassName="text-foreground/40 font-normal text-xs uppercase tracking-wide">
              Company
            </AppTypography>
            <ul className="list-none space-y-3">
              {COMPANY_LINKS.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </section>

      <AppSeparator />

      {/* Policy summary line — policy-NEUTRAL on returns. The catalog mixes
          made-to-order (POD, Printful terms: defect claims within 30 days, no
          remorse returns) with standard items ({POLICY.returnWindowDays}-day
          window), so a sitewide "N-day returns" claim over-promises on POD
          pages — the exact visible-copy inconsistency class flagged in the
          GMC misrepresentation remediation. Per-item terms live on the PDP;
          the footer links the policy instead of asserting a number. */}
      <AppTypography appClassName="text-foreground/40 font-normal text-xs">
        Secure checkout · Refunds to your {POLICY.refundMethod} · Ships in{" "}
        {POLICY.handlingTimeDays} ·{" "}
        <Link href="/returns-policy" className="underline underline-offset-2">
          Return policy
        </Link>
      </AppTypography>

      <section className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <AppTypography appClassName="text-foreground/40 font-normal text-sm">
            Powered by
          </AppTypography>
          <Link href={SITE.homepage} aria-label={`${SITE.name} home`}>
            <DroplinkedLogo
              aria-label={`${SITE.name} logo`}
              className="h-5 w-auto text-foreground"
            />
          </Link>
        </div>
        <AppTypography appClassName="text-foreground/40 font-normal text-sm sm:text-end">
          © {year} {SITE.legalName}. All rights reserved.
        </AppTypography>
      </section>
    </footer>
  );
};

export default Footer;
