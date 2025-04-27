import { IAddToCartService, IChangeQuantityService, IGetCartService, IGetPaymentMethodsService, IUpdateCartDetailsService } from './interface';

// Create a new cart
export const createCartService = () => {
  return fetch('/api/cart', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to create cart');
      return response.json();
    });
};

// Add an item to the cart
export const addToCartService = ({ cartId, ...body }: IAddToCartService) => {
  return fetch(`/api/cart/${cartId}`, { 
    method: 'POST', 
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    });
};

// Update the quantity of an item in the cart
export const changeQuantityService = ({ cartId, ...body }: IChangeQuantityService) => {
  return fetch(`/api/cart/${cartId}`, { 
    method: 'PATCH', 
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update cart item quantity');
      return response.json();
    });
};

// Fetch the cart by cartId
export const getCartService = ({ cartId }: IGetCartService) => {
  return fetch(`/api/cart/${cartId}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    });
};

// Get payment methods for a cart
export const getPaymentMethodsService = ({ cartId }: IGetPaymentMethodsService) => {
  return fetch(`/api/cart/${cartId}/payment-methods`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      return response.json();
    });
};

// Update cart details with email and address
export const updateCartDetailsService = ({ cartId, ...body }:  IUpdateCartDetailsService ) => {
  return fetch(`/api/cart/${cartId}/details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update cart details');
      return response.json();
    });
};

