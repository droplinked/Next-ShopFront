import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/core/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | droplinked",
  description: SITE.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage
      title={`About ${SITE.name}`}
      intro={SITE.tagline}
      updated="July 2026"
    >
      <LegalSection heading="Who We Are">
        <p>{SITE.description}</p>
      </LegalSection>

      <LegalSection heading="How Shopping Works">
        <p>
          Every product you see is offered by a verified merchant on the
          droplinked platform. When you check out, payment is processed securely
          through our payment providers, and the merchant fulfills and ships
          your order. droplinked provides the storefront, checkout, and buyer
          support that make the purchase safe and reliable.
        </p>
      </LegalSection>

      <LegalSection heading="Our Commitment">
        <p>
          We stand behind transparent pricing, accurate product information, a
          clear{" "}
          <Link
            href="/returns-policy"
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            returns &amp; refunds policy
          </Link>
          , and responsive support. If anything about your order isn&apos;t
          right, our team will make it right.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
