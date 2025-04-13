import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';
    const countryName = url.searchParams.get('country_name') || '';
    
    // Ensure name parameter is enclosed in quotes for the API
    const quotedName = `"${name}"`;
    
    const data = await fetchInstance(`locations/cities?name=${encodeURIComponent(quotedName)}&country_name=${countryName}`, {
      next: { revalidate: 3600 }
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Cities API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}