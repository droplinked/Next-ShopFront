import { fetchInstance } from "../fetch-config";
import { IAddToCartService, ICahngeQuantityService, IGetCartService } from "./interface";

export const create_cart_service = () => fetchInstance(`cart`, { method: "POST" });
export const add_to_cart_service = ({ cartId, ...body }: IAddToCartService) => fetchInstance(`cart/${cartId}`, { method: "POST", body: JSON.stringify(body) });
export const change_quantity_service = ({ cartId, ...body }: ICahngeQuantityService) => fetchInstance(`cart/${cartId}`, { method: "PATCH", body: JSON.stringify(body) });
export const get_cart_service = ({ cartId }: IGetCartService) => fetchInstance(`cart/${cartId}`);
