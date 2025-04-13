import { NextRequest, NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function GET(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  const { cartId } = params;
  
  try {
    const data = await fetchInstance(`cart/${cartId}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  const { cartId } = params;
  
  try {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  const { cartId } = params;
  
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