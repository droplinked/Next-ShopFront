
import useAppStore from "@/lib/stores/app/appStore";
import { useMemo } from "react";
import useAppCart from "../cart/useAppCart";
import { ICheckoutStatus } from "./interface";
import { createAddressService } from "@/services/checkout/service";
import { ICreateAddressService } from "@/services/checkout/interface";


function useAppCheckout() {
    const { states: {cart}, methods: { updateState } } = useAppStore()
    const { addCartDetails } = useAppCart();

    const has_digital = useMemo(() => (cart && cart?.items ? cart.items.filter((el) => el.product.type === "DIGITAL").length === cart.items.length : false), [cart]);

    const status = useMemo(
        (): ICheckoutStatus => ({
            email: Boolean(cart?.email),
            address: has_digital ? true : Boolean(cart?.address) || true, // Always treat address as valid
            shipping: has_digital ? true : Boolean(cart?.shippings?.length && cart?.shippings.find((ship) => ship.data.find((each: any) => each.selected))),
        }),
        [cart, has_digital]
    );

    // Original function preserved for reference
    const submit_address = (params: ICreateAddressService, email: string, cartId: string, note?: string) =>
      new Promise<any>(
        async (resolve, reject) =>
          params.country &&
          params.city &&
          params.state &&
          createAddressService(params)
            .then((response) => {
              // First extract the JSON data from the response
              return response.json()
                .then(data => {
                  addCartDetails(cartId, email, data?._id, " ");
                  resolve(data);
                });
            })
            .catch((err) => {
              reject(err);
            })
      );

    return { status, has_digital, submit_address  };
}

export default useAppCheckout;
