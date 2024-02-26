import { fetchInstance } from "../fetch-config";
import { IGetProductsService } from "./interface";
export const get_products_service = ({ page, limit, filter }: IGetProductsService) => fetchInstance(`products?page=${page}${limit && `&limit=${limit}`}${filter && `&filter=title:${filter}`}`, {cache: "force-cache"});
