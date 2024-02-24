import axiosInstance from "../axios-config";
import { IAddToCartService } from "./interface";

export const create_cart_service = () => axiosInstance.post(`cart`)

export const add_to_cart_service = (params: IAddToCartService) => {
    const { cartId, ...body } = params;
    return axiosInstance.post(`cart/${cartId}`, body);
};
