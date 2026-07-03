import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/core/legal/LegalPage";
import { POLICY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping Policy | droplinked",
  description:
    "Shipping policy for droplinked orders — order handling time, delivery " +
    "estimates, shipping costs, and international shipping.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping Policy"
      intro="How and when your order ships, and what to expect during delivery."
      updated="July 2026"
    >
      <LegalSection heading="Order Processing">
        <p>
          Orders are processed and handed to the carrier within{" "}
          <strong>{POLICY.handlingTimeDays}</strong> after payment is
          confirmed. You will receive a confirmation email, and a tracking
          number once your order ships.
        </p>
      </LegalSection>

      <LegalSection heading="Delivery Estimates">
        <p>
          Domestic delivery typically takes 3–7 business days after dispatch,
          depending on your location and the carrier. Delivery times are
          estimates and are not guaranteed. Any product-specific handling or
          made-to-order lead time is shown on the product page.
        </p>
      </LegalSection>

      <LegalSection heading="Shipping Costs">
        <p>
          Shipping costs are calculated and displayed at checkout before you
          pay, based on the destination and the items in your cart. Any duties
          or import taxes for international orders are the responsibility of the
          recipient.
        </p>
      </LegalSection>

      <LegalSection heading="International Shipping">
        <p>
          Availability of international shipping depends on the merchant and the
          product. Where offered, delivery estimates and costs are shown at
          checkout. Customs processing may add to the total delivery time.
        </p>
      </LegalSection>

      <LegalSection heading="Lost or Delayed Shipments">
        <p>
          If your order has not arrived within the estimated window, contact our
          support team and we will investigate with the carrier and make it
          right.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
