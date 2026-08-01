import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/core/legal/LegalPage";
import { POD_POLICY, POLICY, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns & Refunds | droplinked",
  description:
    "Return and refund policy for orders placed on droplinked — return " +
    "window, condition requirements, refund method, and how to start a return.",
  alternates: { canonical: "/returns-policy" },
};

export default function ReturnsPolicyPage() {
  return (
    <LegalPage
      title="Returns & Refunds"
      intro="We want you to be satisfied with your purchase. This policy explains when and how you can return an item and receive a refund."
      updated="July 2026"
    >
      <LegalSection heading={`${POLICY.returnWindowDays}-Day Return Window`}>
        <p>
          You may request a return within{" "}
          <strong>{POLICY.returnWindowDays} days of delivery</strong>. To be
          eligible, items must be unused, in their original condition, and
          include any original packaging, tags, and accessories.
        </p>
      </LegalSection>

      <LegalSection heading="How to Start a Return">
        <p>
          Email{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>{" "}
          with your order number and the item(s) you would like to return. Our
          team will confirm eligibility and provide return instructions,
          typically within 1–2 business days.
        </p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <p>
          Once we receive and inspect your returned item, we will issue a
          refund to your <strong>{POLICY.refundMethod}</strong>. Refunds are
          processed within <strong>{POLICY.refundProcessingDays}</strong> of
          the return being received. Original shipping charges are
          non-refundable unless the return is due to our error (for example, a
          defective or incorrect item).
        </p>
      </LegalSection>

      <LegalSection heading="Return Shipping Costs">
        <p>
          Customers are responsible for return shipping costs unless the item
          arrived damaged, defective, or was sent in error, in which case
          droplinked covers return shipping and replacement or refund.
        </p>
      </LegalSection>

      <LegalSection heading="Made-to-Order (Print-on-Demand) Items">
        <p>
          Some items on droplinked are printed on demand — produced
          individually for your order by our fulfillment partner. Because each
          piece is made just for you, made-to-order items cannot be returned
          or exchanged for a different size or a change of mind. These items
          are identified as made to order on the product page before purchase.
        </p>
        <p>
          If a made-to-order item arrives damaged, misprinted, or defective,
          email{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>{" "}
          within <strong>{POD_POLICY.claimWindowDays} days of delivery</strong>{" "}
          with your order number and photos of the issue. We will send a
          replacement or issue a full refund at no cost to you.
        </p>
        <p>
          For customers in the European Union: under Article 16(c) of
          Directive 2011/83/EU on consumer rights, the 14-day right of
          withdrawal does not apply to goods made to the consumer&apos;s
          specifications or clearly personalized. Your statutory rights for
          defective goods are not affected.
        </p>
      </LegalSection>

      <LegalSection heading="Non-Returnable Items">
        <p>
          Certain items — such as digital goods, downloadable products, and
          made-to-order or personalized items — may be non-returnable once
          delivered or produced. Any such exceptions are noted on the product
          page before purchase.
        </p>
      </LegalSection>

      <LegalSection heading="Damaged or Incorrect Orders">
        <p>
          If your order arrives damaged or incorrect, contact us within 7 days
          of delivery at{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-mint-500 transition-colors hover:text-mint-400"
          >
            {SITE.supportEmail}
          </a>{" "}
          with photos, and we will arrange a replacement or full refund at no
          cost to you.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
