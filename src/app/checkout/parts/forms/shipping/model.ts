import { ICartShippings } from "@/lib/stores/app/interfaces/cart";

namespace shippingModel {
    export const initialShippingValues = (shippings: ICartShippings[]) => shippings?.map((shipping) => shipping.data[0] && { groupId: shipping.groupId, shipmentId: shipping.data[0].id }) || {groupId: "", shipmentId: ""};
}

export default shippingModel;
