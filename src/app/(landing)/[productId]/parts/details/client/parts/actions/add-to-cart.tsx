import AppIcons from '@/assets/AppIcons';
import { AppButton } from '@/components/ui';
import useAppCart from '@/state/hooks/cart/useAppCart';
import { useContext } from 'react';
import { toast } from 'sonner';
import ProductContext from '../../context';

const ClientProductActions = () => {
  const {states: { sku,  option: { quantity } } } = useContext(ProductContext);
  const { addItemToCart } = useAppCart();

  const submit = async (e: React.FormEvent<HTMLFormElement>) =>
    toast.promise(
      async () => {
        e.preventDefault();
        return await addItemToCart({ skuID: sku._id, quantity });
      },
      { loading: 'Adding product to your cart...', success: 'Added to your cart!', error: 'Something went wrong.' }
    );
    
  return (
    <div className="flex w-full gap-6">
      <div className="min-w-fit">
        <AppButton appClassName="rounded-sm w-full" hasIcon appVariant="outlined" appSize="lg">
          <AppIcons.Merch />
          Mint to Merch
        </AppButton>
      </div>
      <form className="w-full" onSubmit={submit}>
        <AppButton type="submit" appClassName="rounded-sm w-full" hasIcon appVariant="filled" appSize="lg">
          <AppIcons.CartLight />
          Add to cart
        </AppButton>
      </form>
    </div>
  );
};

export default ClientProductActions;
