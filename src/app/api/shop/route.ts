import { fetchInstance } from '@/lib/fetchInstance';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  try {
    // Basic shop information endpoint
    const data = await fetchInstance(`shop?${searchParams.toString()}`, { cache: 'no-cache' });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Shop API route error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}