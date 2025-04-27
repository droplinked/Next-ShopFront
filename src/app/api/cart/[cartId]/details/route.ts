import { NextRequest, NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }>}
) {
  try {
    const { cartId } = await params;
    const body = await request.json();
    
    // Get the data from the request body
    const { email, addressId, note } = body;
    
    // Use fetchInstance instead of direct fetch
    const data = await fetchInstance(`cart/${cartId}/details`, {
      method: 'POST',
      body: JSON.stringify({ email, addressId, note })
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart details API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}