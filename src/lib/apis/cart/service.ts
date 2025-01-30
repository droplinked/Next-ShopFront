import { fetchInstance } from '../fetch-config';
import { IAddToCartService, IChangeQuantityService, IGetCartService } from './interface';

// Create a new cart
export const createCartService = () => {
  return fetchInstance(`cart`, { method: 'POST' });
};

// Add an item to the cart
export const addToCartService = ({ cartId, ...body }: IAddToCartService) => {
  return fetchInstance(`cart/${cartId}`, { method: 'POST', body: JSON.stringify(body) });
};

// Update the quantity of an item in the cart
export const changeQuantityService = ({ cartId, ...body }: IChangeQuantityService) => {
  return fetchInstance(`cart/${cartId}`, { method: 'PATCH', body: JSON.stringify(body) });
};

// Fetch the cart by cartId
export const getCartService = ({ cartId }: IGetCartService) => {
  return fetchInstance(`cart/${cartId}`);
};
