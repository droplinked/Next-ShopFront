import { NextRequest, NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{cartId: string, itemId: string}>}
) {
  const { cartId, itemId } = await params;
  
  try {
    const data = await fetchInstance(`cart/${cartId}/items/${itemId}`, { method: 'DELETE' });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cart Item API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}