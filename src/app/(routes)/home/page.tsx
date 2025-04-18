'use client';

import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import useAppShop from '@/state/hooks/shop/useAppShop';
import { useEffect, useState } from 'react';
import Banner from './components/banner/banner';
import Initial from './components//initial/initial';
import ProductBrowser from './components/product-browser/ProductBrowser';

interface ShopData {
  name?: string;
  backgroundImage?: string;
  logo?: string;
  description?: string;
  backgroundColor?: string;
  _id?: string;
  [key: string]: any;
}

export default function Home() {
  const { fetchShopData } = useAppShop();
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getShopData = async () => {
      try {
        const shopData = await fetchShopData();
        setData(shopData);
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    getShopData();
  }, []);

  if (loading) {
    return (
      <div className="container flex justify-center items-center mt-20 min-h-[50vh]">
        Loading...
      </div>
    );
  }

  return (
    <main className={cn('container flex gap-8 mt-20', app_vertical)}>
      <Initial data={data} />
      {data?.backgroundImage && data?.name && (
        <Banner src={data?.backgroundImage} alt={data?.name} />
      )}
      <ProductBrowser />
    </main>
  );
}
