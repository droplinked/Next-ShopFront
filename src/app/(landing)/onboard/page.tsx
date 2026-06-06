import { redirect } from "next/navigation";

/**
 * /onboard is an alias for /claim-your-shop.
 *
 * Cold-outbound email subject lines test better when the destination URL
 * reads as a verb-action ("/claim-your-shop") rather than a brand-internal
 * funnel name. Keep both routes pointed at the same surface so we don't
 * burn a campaign re-routing later.
 */
export default function OnboardPage() {
    redirect("/claim-your-shop");
}
