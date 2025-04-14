import { ICreateAddressService } from "@/lib/apis/checkout/interface";
import { createAddressService } from "@/lib/apis/checkout/service";
import useAppStore from "@/lib/stores/app/appStore";
import { useMemo } from "react";
import useAppCart from "../cart/useAppCart";
import { ICheckoutStatus } from "./interface";


function useAppCheckout() {
    const { states: {cart} } = useAppStore()
    const { addCartDetails } = useAppCart();

    const has_digital = useMemo(() => (cart && cart?.items ? cart.items.filter((el) => el.product.type === "DIGITAL").length === cart.items.length : false), [cart]);

    const status = useMemo(
        (): ICheckoutStatus => ({
            email: Boolean(cart?.email),
            address: has_digital ? true : Boolean(cart?.address),
            shipping: has_digital ? true : Boolean(cart?.shippings?.length && cart?.shippings.find((ship) => ship.data.find((each: any) => each.selected))),
        }),
        [cart, has_digital]
    );

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
                  console.log('Address submission successful:', {
                    cartId,
                    email,
                    note,
                    addressId: data?._id,
                    addressDetails: data
                  });
                  
                  // If address is valid, add it to the cart details
                  if (data?._id) {
                    addCartDetails(cartId, email, data?._id, " ");
                  }
                  
                  resolve(data);
                });
            })
            .catch((err) => {
              console.error("Address submission failed:", {
                error: err,
                params,
                email,
                cartId,
                note,
              });
              reject(err);
            })
      );

    return { status, has_digital, submit_address };
}

export default useAppCheckout;
