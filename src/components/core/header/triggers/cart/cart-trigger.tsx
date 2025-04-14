'use client';
import AppIcons from '@/assets/AppIcons';
import { AppButton, AppDialog, AppIconButton, AppSeparator, AppTypography } from '@/components/ui';
import AppShow from '@/components/ui/show/AppShow';
import useAppCart from '@/state/hooks/cart/useAppCart';
import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, app_vertical } from '@/lib/variables/variables';
import { Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { bindToggle, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';
import React, { useEffect } from 'react';
import EachCartItem from './parts/each/each-cart-item';
import EmptyCart from './parts/empty/empty-cart';

const CartTrigger = () => {
  const { states: { cart }, methods: { updateState }} = useAppStore();
  const { fetchCart } = useAppCart();
  const dialogState = usePopupState({ variant: 'dialog', popupId: 'droplinked-dialog-state' });

  useEffect(() => {
    const fetchCartData = async () => {
      if (cart?._id) {
        try {
          await fetchCart(cart._id);
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        }
      }
    };
  
    fetchCartData();
  }, [cart?._id]);

  return (
    <AppDialog
      aria-labelledby="cart-dialog-title"
      TransitionComponent={Transition}
      slotProps={{ backdrop: { timeout: 500, sx: { backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(0.5px)' } } }}
      sx={{
        '& .MuiDialog-paper': {
          display: 'flex',
          paddingY: '24px',
          paddingX: '28px',
          gap: '24px',
          borderRadius: '16px',
          backgroundColor: 'white',
          borderLeft: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          overflowY: 'auto',
          position: 'fixed',
          right: 0,
          top: 0
        }
      }}
      props={{
        dialogState: dialogState,
        trigger: (
          <AppIconButton {...bindToggle(dialogState)}>
            <AppIcons.Cart />
          </AppIconButton>
        ),
        title: {
          children: (
            <header className={cn(app_center, 'w-full justify-between text-xl sticky top-0 bg-background')}>
              <AppTypography appClassName="text-lg">My Cart</AppTypography>
              <AppIcons.Close onClick={dialogState.close} className="cursor-pointer" />
            </header>
          )
        },
        content: {
          children: (
            <div className={cn(app_vertical, 'gap-6 p-4 rounded-sm border border-border')}>
              <AppShow
                show={{
                  when: cart?.items?.length,
                  then: cart?.items?.map((item, index, row) => (
                    <div key={item?._id} className="w-full">
                      <EachCartItem item={item} />
                      <AppShow show={{ when: index !== row.length - 1, then: <AppSeparator appClassName="my-6 w-full" /> }} />
                    </div>
                  )),
                  else: <EmptyCart />
                }}
              />
            </div>
          )
        },
        actions: {
          children: (
            <AppShow
              show={{
                when: cart?.items?.length,
                then: (
                  <footer className={cn(app_vertical, 'w-full sticky bottom-0 pb-6 bg-background gap-6')}>
                    <div className={cn(app_center, 'justify-between w-full')}>
                      <AppTypography appClassName="text-sm font-normal">Total Cart</AppTypography>
                      <AppTypography price appClassName="text-xl font-medium">
                        {cart?.totalCart?.subtotal}
                      </AppTypography>
                    </div>
                    <div
                      onSubmit={(e) => {
                        e.preventDefault();
                      }}
                      className="flex justify-center items-center w-full gap-6"
                    >
                      <div className="min-w-fit">
                        <AppButton
                          onClick={() => updateState({ state: 'cart', value: {} } , )}
                          appClassName="rounded-sm w-full text-base font-normal"
                          appVariant="outlined"
                          appSize="md"
                        >
                          Clear
                        </AppButton>
                      </div>
                      <Link href={'/checkout'} className="flex items-center justify-center w-full py-3 px-4 border-none bg-foreground text-background rounded-sm">
                        <AppTypography>Checkout</AppTypography>
                      </Link>
                    </div>
                  </footer>
                )
              }}
            />
          )
        }
      }}
    />
  );
};

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="left" ref={ref} {...props} />;
  });

export default CartTrigger;
