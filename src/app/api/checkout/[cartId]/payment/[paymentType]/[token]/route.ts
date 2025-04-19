import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function POST(request: Request, { params }: { params: Promise<{ cartId: string, paymentType: string, token: string }> }) {
  try {
    const { cartId, paymentType, token } = await params;
    const body = await request.json();
    
    const data = await fetchInstance(`checkout/${cartId}/payment/${paymentType}/${token}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Crypto payment API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}