import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function GET(request: Request) {
  try {
  
    const data = await fetchInstance(`locations/countries`, {
      next: { revalidate: 3600 }
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Countries API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}