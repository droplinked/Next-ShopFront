import AppIcons from '@/assets/AppIcons';
import { AppButton } from '@/components/ui';
import useAppCart from '@/state/hooks/cart/useAppCart';
import { useContext } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ProductContext } from '../context';
import { MOR_CHECKOUT_ENABLED } from '@/lib/variables/variables';

const ProductCartActions = () => {
  const {
    states: {
      product,
      sku,
      option: { quantity },
    },
  } = useContext(ProductContext);
  const { addItemToCart } = useAppCart();
  const params = useParams();

  // Normal shop-scoped add-to-cart.
  const addToCart = async (e: React.FormEvent<HTMLFormElement>) =>
    toast.promise(
      async () => {
        e.preventDefault();
        return await addItemToCart({ skuID: sku._id, quantity });
      },
      {
        loading: 'Adding product to your cart...',
        success: 'Added to your cart!',
        error: 'Something went wrong.',
      },
    );

  // Merchant-of-Record checkout (flag-gated). The aggregate storefront root has
  // no shop context, so Buy routes through the backend MoR endpoint (platform
  // Stripe as MoR) → Stripe Checkout, which collects the email. A per-attempt
  // cartToken is the idempotency key so a retried click never double-creates.
  const morCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return toast.promise(
      async () => {
        // The product ObjectId must come from the product CONTEXT, not the URL:
        // on the unified SEO landing route /<merchant>/product/<slug> the first
        // URL segment (folder-named [productId]) carries the MERCHANT handle,
        // so params.productId would send e.g. "unstoppable" and the backend DTO
        // rejects it ("productId must be a mongodb id"). The context product is
        // authoritative on both routes; keep the URL param only as a fallback
        // for the id-route while context hydrates.
        const raw = params?.productId;
        const fromUrl = Array.isArray(raw) ? raw[0] : raw;
        const productId = product?._id || fromUrl;
        if (!productId || !sku?._id) throw new Error('Missing product or variant');
        const cartToken =
          globalThis.crypto?.randomUUID?.() ??
          `mor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // Same-origin proxy (BASE_API_URL is not inlined in the client bundle;
        // the aggregate root has no x-shop-id). The /api route forwards to
        // apiv3's public /mor-checkout/session server-side.
        const res = await fetch(`/api/mor-checkout/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, skuId: sku._id, quantity, cartToken }),
        });
        if (!res.ok) throw new Error(`Checkout unavailable (${res.status})`);
        const json = await res.json().catch(() => ({}));
        const url = json?.data?.checkoutUrl ?? json?.checkoutUrl;
        if (!url) throw new Error('No checkout URL returned');
        window.location.href = url;
        return url;
      },
      {
        loading: 'Starting secure checkout…',
        success: 'Redirecting to checkout…',
        error: 'Checkout is unavailable right now.',
      },
    );
  };

  return (
    <div className="flex w-full gap-6">
      <div className="min-w-fit">
        <AppButton
          appClassName="rounded-sm w-full"
          hasIcon
          appVariant="outlined"
          appSize="lg"
        >
          <AppIcons.Merch />
          Mint to Merch
        </AppButton>
      </div>
      <form
        className="w-full"
        onSubmit={MOR_CHECKOUT_ENABLED ? morCheckout : addToCart}
      >
        <AppButton
          type="submit"
          appClassName="rounded-sm w-full"
          hasIcon
          appVariant="filled"
          appSize="lg"
        >
          <AppIcons.CartLight />
          {MOR_CHECKOUT_ENABLED ? 'Buy now' : 'Add to cart'}
        </AppButton>
      </form>
    </div>
  );
};

export default ProductCartActions;
