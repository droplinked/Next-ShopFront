import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/core/legal/LegalPage";
import { SITE, SITE_ADDRESS_LINE, SITE_PHONE_TEL, SOCIAL_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us | droplinked",
  description:
    "Get in touch with droplinked support for help with orders, returns, " +
    "shipping, and product questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact Us"
      intro="Our support team is here to help with orders, returns, shipping, and any product questions."
      updated="July 2026"
    >
      <LegalSection heading="Customer Support">
        <p>
          Email us at{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>{" "}
          or call{" "}
          <a
            href={SITE_PHONE_TEL}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportPhone}
          </a>
          . We aim to respond within 1–2 business days. Please include your
          order number so we can help you faster.
        </p>
      </LegalSection>

      <LegalSection heading="Business Details">
        <p>
          <strong>{SITE.legalName}</strong>
          <br />
          <span className="block">{SITE_ADDRESS_LINE}</span>
          {SITE.tagline}
          <br />
          Website:{" "}
          <a
            href={SITE.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.homepage.replace(/^https?:\/\//, "")}
          </a>
        </p>
      </LegalSection>

      <LegalSection heading="Follow Us">
        <p className="flex flex-wrap gap-4">
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            LinkedIn
          </a>
          <a
            href={SOCIAL_LINKS.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            X (Twitter)
          </a>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            Instagram
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
