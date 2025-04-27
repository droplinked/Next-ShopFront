import { NextRequest, NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params;
  
  try {
    const data = await fetchInstance(`cart/payment-methods/${cartId}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Payment methods API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}