import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/core/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | droplinked",
  description:
    "How droplinked collects, uses, and protects your personal information " +
    "when you shop on our platform.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what information ${SITE.name} collects when you visit or place an order, how it is used, and the choices you have.`}
      updated="July 2026"
    >
      <LegalSection heading="Information We Collect">
        <p>
          When you place an order or create an account we collect the
          information you provide — such as your name, email address, shipping
          address, and order details. Payment card details are collected and
          processed directly by our PCI-compliant payment providers; droplinked
          does not store full card numbers.
        </p>
      </LegalSection>

      <LegalSection heading="How We Use Your Information">
        <p>
          We use your information to process and fulfill orders, provide
          customer support, prevent fraud, and — where you have opted in — send
          you updates. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing With Service Providers">
        <p>
          We share information only as needed with the service providers that
          make your order possible — payment processors, shipping carriers, and
          the merchant fulfilling your order. These providers are permitted to
          use your information only to perform their services.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          We use cookies and similar technologies to keep you signed in,
          remember your cart, and understand how the storefront is used. You can
          control cookies through your browser settings.
        </p>
      </LegalSection>

      <LegalSection heading="Data Retention & Your Rights">
        <p>
          We retain order information for as long as needed to provide our
          services and meet legal obligations. You may request access to,
          correction of, or deletion of your personal information by contacting{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          We use industry-standard safeguards, including encryption in transit,
          to protect your information. No method of transmission is 100% secure,
          but we work to protect your data and notify you of material incidents
          as required by law.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
