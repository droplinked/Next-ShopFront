import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/core/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service | droplinked",
  description:
    "The terms that govern your use of the droplinked storefront and your " +
    "purchases.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms govern your use of ${SITE.name} and any purchase you make through the storefront.`}
      updated="July 2026"
    >
      <LegalSection heading="Acceptance of Terms">
        <p>
          By accessing or using the storefront and placing an order, you agree
          to these Terms of Service. If you do not agree, please do not use the
          storefront.
        </p>
      </LegalSection>

      <LegalSection heading="Orders & Acceptance">
        <p>
          Your order is an offer to purchase. We may accept or decline an order,
          and we reserve the right to cancel and refund an order in the event of
          a pricing or availability error. You will be notified and refunded in
          full if this happens.
        </p>
      </LegalSection>

      <LegalSection heading="Pricing & Payment">
        <p>
          Prices are shown in the currency indicated at checkout and include the
          amounts displayed before you pay. Payment is captured through our
          secure payment providers. You represent that you are authorized to use
          the payment method you provide.
        </p>
      </LegalSection>

      <LegalSection heading="Returns & Refunds">
        <p>
          Returns and refunds are governed by our{" "}
          <a
            href="/returns-policy"
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            Returns &amp; Refunds policy
          </a>
          , which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual Property">
        <p>
          All content on the storefront, including product images and
          descriptions, is owned by droplinked, the selling merchant, or their
          licensors, and may not be reused without permission.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, droplinked and the selling
          merchant are not liable for indirect or consequential damages arising
          from your use of the storefront. Nothing in these terms limits rights
          you have under applicable consumer-protection law.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
