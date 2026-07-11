'use server';

import { notFound } from 'next/navigation';
import ProductDescription from './components/ProductDescription';
import ProductDetails from './components/details/ProductDetails';

import { AppSeparator } from '@/components/ui';
import ProductSlider from './components/ProductSlider';
import { getInteractiveProduct } from './lib/product-data';

// type IProps = { params: { productId: string } };

export default async function Page({ params } : { params: Promise<{ productId: string }>}) {
  const { productId } = await params
  // Fail-open loader: resolves the product across single-shop + aggregate
  // storefronts and never throws. `null` = genuinely unresolvable → a real 404
  // page, never the "Application error" black screen (see lib/product-data.ts).
  const data = await getInteractiveProduct(productId);
  if (!data) notFound();

  return (
    <main className="container px-8 flex items-start md:flex-row flex-col justify-center w-full gap-12 mt-20">
      <div className="min-w-full md:min-w-[40%] md:sticky left-0 top-24">
        <ProductSlider media={data?.media} />
      </div>
      <div className="flex flex-col gap-9 min-w-full md:min-w-[60%]">
        <ProductDetails product={data} />
        <AppSeparator />
        <ProductDescription description={data?.description || ''} />
      </div>
    </main>
  );
}
