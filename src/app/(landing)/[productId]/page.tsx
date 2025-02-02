'use server';

import { fetchInstance } from '@/lib/apis/fetch-config';
import { Metadata } from 'next';
import { AppSeparator } from '@/components/shared';
import { ProductDescription, ProductDetails, ProductSlider } from './parts';

type IProps = { params: { productId: string } };

export async function generateMetadata({ params }: IProps): Promise<Metadata> {
  const product = await fetchInstance(`products/${params.productId}`);
  return { title: `droplinked | ${product?.title}` };
}

export default async function Page({ params }: IProps) {
  const data = await fetchInstance(`products/${params.productId}`);
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
