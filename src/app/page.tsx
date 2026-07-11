import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ROOT_CATALOG_ENABLED } from "@/lib/variables/variables";
import { SITE, SITE_URL } from "@/lib/site";
import { fetchMarketplaceCatalog } from "@/lib/catalog/marketplace-catalog-data";
import MarketplaceCatalog from "@/components/catalog/MarketplaceCatalog";

// ISR — revalidate every 5 minutes (shared by generateMetadata + the page).
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  // Flag OFF: the page redirects to /home, so no special metadata is needed.
  if (!ROOT_CATALOG_ENABLED) return {};

  const canonical = `${SITE_URL}/`;
  const title = `Shop all products | ${SITE.name}`;
  const description = SITE.description;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootPage() {
  // Default-OFF on prod: until the catalog flag is enabled for an environment,
  // the root keeps its existing behaviour (redirect to the single-shop /home).
  if (!ROOT_CATALOG_ENABLED) {
    redirect("/home");
  }

  const catalog = await fetchMarketplaceCatalog({ page: 1, limit: 48, type: "physical" });
  return <MarketplaceCatalog products={catalog.products} total={catalog.total} />;
}
