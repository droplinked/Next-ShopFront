import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function POST(request: Request, { params }: { params: { cartId: string } }) {
  try {
    const { cartId } = params;
    const body = await request.json();
    
    const data = await fetchInstance(`checkout/${cartId}/payment/stripe`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Stripe payment API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}