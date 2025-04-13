import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Get cartId from the path
  const cartId = pathSegments[pathSegments.length - 1] !== 'cart' ? pathSegments[pathSegments.length - 1] : null;
  
  if (!cartId) {
    return NextResponse.json({ error: "Cart ID is required" }, { status: 400 });
  }

  try {
    const data = await fetchInstance(`cart/${cartId}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Get cartId from the path
  const cartId = pathSegments[pathSegments.length - 1] !== 'cart' ? pathSegments[pathSegments.length - 1] : null;
  
  try {
    // Create a new cart
    if (!cartId) {
      const data = await fetchInstance('cart', { method: 'POST' });
      return NextResponse.json(data);
    }
    
    // Add item to cart
    const body = await request.json();
    const data = await fetchInstance(`cart/${cartId}`, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Get cartId from the path
  const cartId = pathSegments[pathSegments.length - 1] !== 'cart' ? pathSegments[pathSegments.length - 1] : null;
  
  if (!cartId) {
    return NextResponse.json({ error: "Cart ID is required" }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    const data = await fetchInstance(`cart/${cartId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Check if we have item ID in the path
  const lastSegment = pathSegments[pathSegments.length - 1];
  const secondLastSegment = pathSegments[pathSegments.length - 2];
  
  let cartId, itemId;
  
  if (secondLastSegment === 'items') {
    // Format: /api/cart/{cartId}/items/{itemId}
    itemId = lastSegment;
    cartId = pathSegments[pathSegments.length - 3];
  } else {
    // Use search params as fallback
    const searchParams = url.searchParams;
    cartId = searchParams.get('cartId');
    itemId = searchParams.get('itemId');
  }
  
  if (!cartId || !itemId) {
    return NextResponse.json({ error: "Cart ID and Item ID are required" }, { status: 400 });
  }
  
  try {
    const data = await fetchInstance(`cart/${cartId}/items/${itemId}`, { method: 'DELETE' });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}