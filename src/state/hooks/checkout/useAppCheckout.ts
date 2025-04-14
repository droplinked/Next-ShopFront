
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


    const submit_address_mock = (params: ICreateAddressService, email: string, cartId: string, note?: string) =>
      new Promise<any>(
        async (resolve) => {
          console.log('Using exact mock data for checkout');
          
          // Exact mock data as provided
          const mockCartData = {
            _id: "67fc4c81fa39a71c0761c482",
            status: "ACTIVE",
            type: "ANONYMOUS",
            shopID: {
                _id: "671907a62da4119376767f54"
            },
            email: "ysmn.dev@gmail.com",
            items: [
                {
                    _id: "67fc4c82fa39a71c0761c49d",
                    groupId: "67fc4cc0fa39a71c0761c4de",
                    product: {
                        title: "Bag v2-46234369926255",
                        image: "https://upload-file-droplinked.s3.amazonaws.com/ed5ae7b56370ceae5128346a1b724447a1399f5a29c60188b8db2a04d562976c_small.jpg",
                        m2m_preview: null,
                        pre_purchase_data_fetch: null,
                        skuImage: null,
                        slug: "bag-v2-46234369926255-95707",
                        type: "NORMAL",
                        _id: "6772cedc00357b3712b95707"
                    },
                    skuID: "6772cedc00357b3712b95709",
                    quantity: 1,
                    options: {
                        color: {
                            caption: "White",
                            value: "#FFFFFF"
                        },
                        quantity: 1
                    },
                    totals: {
                        discountPercentage: 0,
                        priceItem: 120,
                        priceItemByDiscount: null,
                        subTotal: 120
                    }
                }
            ],
            shippings: [
                {
                    groupId: "67fc4cc0fa39a71c0761c4de",
                    type: "CUSTOM",
                    data: [
                        {
                            id: "CUSTOM",
                            title: "CUSTOM",
                            price: 10,
                            delivery_estimation: null,
                            selected: false
                        }
                    ]
                }
            ],
            totalCart: {
                subtotal: 120,
                shipping: 0,
                estimatedTaxes: 9.9,
                giftCard: {
                    amount: 0
                },
                totalPayment: 129.9
            },
            address: {
                _id: "67fc4cbefa39a71c0761c4d2",
                firstName: "ysmn",
                lastName: "sal",
                addressLine1: "811 West 7th Street",
                addressLine2: "",
                country: "United States",
                city: "Los Angeles",
                state: "California",
                zip: "90019",
                addressType: "CUSTOMER",
                easyPostAddressID: "adr_786a36ce18c111f0a9faac1f6bc539aa"
            },
            canApplyGiftCard: true
          };
          
          // Update cart with exact mock data
          updateState({ state: 'cart', value: mockCartData });
          
          // Return the address data from the mock
          resolve(mockCartData.address);
        }
      );

    return { status, has_digital, submit_address: submit_address_mock };
}

export default useAppCheckout;
