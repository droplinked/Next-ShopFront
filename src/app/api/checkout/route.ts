import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/apis/fetch-config';

// Handle address endpoints
export async function POST(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const endpoint = pathSegments[pathSegments.length - 1];
  
  try {
    const body = await request.json();
    
    // Handle various checkout endpoints based on the path
    if (endpoint === 'checkout') {
      // Create a new checkout session
      const data = await fetchInstance('checkout', { 
        method: 'POST',
        body: JSON.stringify(body)
      });
      return NextResponse.json(data);
    }
    
    // Default case: forward the request to the backend
    const data = await fetchInstance(`checkout`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Checkout API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

// Handle other HTTP methods for checkout operations
export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  try {
    // Handle locations/countries endpoint
    if (url.pathname.includes('countries')) {
      const name = searchParams.get('name') || '';
      const data = await fetchInstance(`locations/countries?name=${name}`, {
        next: { revalidate: 3600 }
      });
      return NextResponse.json(data);
    }
    
    // Handle locations/cities endpoint
    if (url.pathname.includes('cities')) {
      const name = searchParams.get('name') || '';
      const countryId = searchParams.get('country_id') || '';
      const data = await fetchInstance(`locations/cities?name=${name}&country_id=${countryId}`, {
        next: { revalidate: 3600 }
      });
      return NextResponse.json(data);
    }
    
    // Default GET handler
    const data = await fetchInstance(`checkout${url.search}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Checkout API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  
  try {
    const body = await request.json();
    
    // Handle gift card application
    if (url.pathname.includes('giftcard')) {
      const data = await fetchInstance(`apply/giftcard`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      return NextResponse.json(data);
    }
    
    // Default PATCH handler
    const data = await fetchInstance(`checkout`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Checkout API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}