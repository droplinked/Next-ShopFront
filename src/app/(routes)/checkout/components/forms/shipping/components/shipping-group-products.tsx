import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_center } from '@/lib/variables/variables';
import { IShippingGroupProps } from './interface';
import BadgedThumbnail from '@/components/ui/summary/badged-thumbnail/BadgedThumbnail';

const ShippingGroupProducts = ({ groupId }: IShippingGroupProps) => {
  const {
    states: { cart },
  } = useAppStore();
  return (
    <div className={cn(app_center, 'justify-start w-full gap-4')}>
      {cart?.items
        .filter((item) => item.groupId === groupId)
        .map((cartItem) => (
          <BadgedThumbnail
            key={cartItem._id}
            number={cartItem.options.quantity}
            image={cartItem.product.image}
            alt={cartItem.product.title}
          />
        ))}
    </div>
  );
};
export default ShippingGroupProducts;
