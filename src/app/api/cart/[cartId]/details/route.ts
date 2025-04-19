import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }>}
) {
  try {

    const {cartId} = await params;
    const body = await request.json();
    
    // Get the data from the request body
    const { email, addressId, note } = body;
    
    // Call your backend API with the combined data
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/${cartId}/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, addressId, note }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update cart details');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating cart details:', error);
    return NextResponse.json(
      { message: 'Failed to update cart details' },
      { status: 500 }
    );
  }
}