import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    const data = await fetchInstance(`apply/giftcard`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Apply gift card API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}