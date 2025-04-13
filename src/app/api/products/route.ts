import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const url = id 
      ? `products/${id}`
      : `products?${searchParams.toString()}`;

    const data = await fetchInstance(url);
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
