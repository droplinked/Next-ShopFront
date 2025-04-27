import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';
import { promises } from 'dns';

export async function POST(request: Request,{ params } : { params: Promise<{ chain: string }>}) {
  try {
    const { chain } = await params;
    const body = await request.json();
    
    const data = await fetchInstance(`checkout/payment/${chain}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Submit order payment API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}