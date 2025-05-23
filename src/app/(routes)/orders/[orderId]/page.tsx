'use server';

import { AppProductSummary } from '@/components/ui';
import { fetchInstance } from '@/lib/fetchInstance';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { roboto } from '@/styles/fonts';
import { IOrder } from '@/types/interfaces/order/order';
import { Metadata } from 'next';
import deployHashModel from './model';
import OrderInformationLayout from './OrderInformationLayout';


export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const order = await fetchInstance(`order/${orderId}`, { cache: 'no-cache' }).then((res: IOrder) => res);
  const address_array = order?.details?.address?.split(', ');
  const { style, title } = deployHashModel.status_design(order?.details?.status);

  console.log(order);

  return (
    <main className="container flex flex-col lg:flex-row items-start justify-between gap-12 pt-20">
      <div className={cn(app_vertical, 'w-full lg:min-w-[70%] gap-6')}>
        <OrderInformationLayout
          header="Order Information"
          rows={[
            { key: 'Order ID', value: order?.details?.orderId },
            { key: 'Status', value: title, className: style },
            {
              key: 'Transaction ID',
              value: (
                <a
                  className={cn(roboto.className, 'font-medium text-sm text-[#179EF8] underline cursor-pointer')}
                  target="_blank"
                  href={deployHashModel.deploy_hash_link(order?.details?.deployHash || '', order?.details?.chain)}
                >
                  {order?.details?.deployHash}
                </a>
              ),
              condition: Boolean(order?.details?.deployHash ?? false) && Boolean(order?.details?.deployHash) && Boolean(order?.details?.chain)
            },
            { key: 'Payment Method', value: order?.details?.chain },
            { key: 'Shipping Address', value: order?.details?.address?.replace(', ,', ', ').split(', ').join(' - ') }
          ]}
        />
        <OrderInformationLayout
          header="Shipping Details"
          rows={[
            { key: 'Address Line 1', value: address_array[0] },
            { key: 'Address Line 1', value: address_array[1], condition: Boolean(address_array[1]) && Boolean(address_array[1] !== '') },
            { key: 'Country', value: address_array[2] },
            { key: 'State', value: address_array[3] },
            { key: 'City', value: address_array[4] },
            { key: 'Zip Code', value: address_array[5] }
          ]}
        />
        <OrderInformationLayout
          header="Payment Details"
          rows={[
            { key: 'Items', value: order?.details?.items?.toFixed(2), price: true },
            { key: 'Shipping', value: order?.details?.shipping?.toFixed(2), price: true },
            { key: 'Tax', value: order?.details?.tax?.toFixed(2), price: true },
            { key: 'Total', value: order?.details?.totalCost?.toFixed(2), price: true },
            { key: 'Paid with', value: order?.details?.chain }
          ]}
        />
        
      </div>
      <div className="min-w-[30%] sticky left-0 top-24 p-6 gap-6  rounded-sm border">
        <h1 className={cn('font-semibold text-base text-foreground text-left w-full mb-4', roboto.className)}>Order Summary</h1>
        <div className={cn(app_vertical, 'gap-6 w-full')}>
          {order?.items?.map(({ _id, size, color, quantity, price, image, title }) => (
            <AppProductSummary key={_id} details={{ size, color, quantity, priceItem: price, image, title }} />
          ))}
        </div>
      </div>
    </main>
  );
}
