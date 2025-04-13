import { IGetProductsService } from './interface';

export const get_products_service = ({ page, limit, filter }: IGetProductsService) =>
  fetch(`api/products?page=${page}${limit ? `&limit=${limit}` : ''}${filter ? `&filter=title:${filter}` : ''}`, { next: { revalidate: 3600 } })
    .then(response => response.json());
