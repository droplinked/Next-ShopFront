'use server';

import { notFound } from 'next/navigation';
import ProductExperience from './components/ProductExperience';
import { getInteractiveProduct } from './lib/product-data';

// type IProps = { params: { productId: string } };

export default async function Page({ params } : { params: Promise<{ productId: string }>}) {
  const { productId } = await params
  // Fail-open loader: resolves the product across single-shop + aggregate
  // storefronts and never throws. `null` = genuinely unresolvable → a real 404
  // page, never the "Application error" black screen (see lib/product-data.ts).
  const data = await getInteractiveProduct(productId);
  if (!data) notFound();

  // ProductExperience is the ONE shared body — the same interactive slider +
  // Buy-now + description now also rendered by the /<merchant>/product/<slug>
  // SEO landing page, so there is a single product experience across both URLs.
  return <ProductExperience product={data} />;
}
