import { AppSeparator, AppTypography } from '@/components/ui';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, app_vertical } from '@/lib/variables/variables';
import { ICart } from '@/types/interfaces/cart/cart';
import React from 'react';

const OrderSummary = ({ totalCart }: Pick<ICart, 'totalCart'>) => {
  return (
    <footer className={cn(app_vertical, 'gap-6 w-full')}>
      <div className={cn(app_vertical, 'w-full gap-4')}>
        {totalCart?.subtotal > 0 && (
          <div className={cn(app_center, 'justify-between w-full')}>
            <AppTypography appClassName="text-sm font-normal">Total cart</AppTypography>
            <AppTypography price appClassName="text-sm font-normal">
              {totalCart.subtotal}
            </AppTypography>
          </div>
        )}
        {totalCart?.estimatedTaxes > 0 && (
          <div className={cn(app_center, 'justify-between w-full')}>
            <AppTypography appClassName="text-sm font-normal">Tax</AppTypography>
            <AppTypography price appClassName="text-sm font-normal">
              {totalCart.estimatedTaxes}
            </AppTypography>
          </div>
        )}
        {totalCart?.shipping > 0 && (
          <div className={cn(app_center, 'justify-between w-full')}>
            <AppTypography appClassName="text-sm font-normal">Shipping</AppTypography>
            <AppTypography price appClassName="text-sm font-normal">
              {totalCart.shipping}
            </AppTypography>
          </div>
        )}
      </div>
      <AppSeparator appClassName="w-full" />
      {totalCart?.totalPayment > 0 && (
        <div className={cn(app_center, 'justify-between w-full')}>
          <AppTypography appClassName="text-sm font-normal">Total order</AppTypography>
          <AppTypography price appClassName="text-sm font-normal">
            {totalCart.totalPayment}
          </AppTypography>
        </div>
      )}
    </footer>
  );
};

export default OrderSummary;
