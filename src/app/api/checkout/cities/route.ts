import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';
    const countryName = url.searchParams.get('country_name') || '';
    const limit = 100; // Set a fixed limit for results
    
    // Build the API URL based on whether name exists
    let apiUrl = '';
    
    if (name && name.trim() !== '') {
      // Include name parameter if it exists and is not empty
      // Do not add quotes around the name parameter
      apiUrl = `locations/cities?name=${encodeURIComponent(name)}&country_name=${encodeURIComponent(countryName)}&limit=${limit}`;
    } else {
      // Exclude name parameter entirely if it doesn't exist or is empty
      apiUrl = `locations/cities?country_name=${encodeURIComponent(countryName)}&limit=${limit}`;
    }
    
    const data = await fetchInstance(apiUrl, {
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