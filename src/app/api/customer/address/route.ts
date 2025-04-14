import { NextResponse } from 'next/server';
import { fetchInstance } from '@/lib/fetchInstance';
import { ICreateAddressService } from '@/services/checkout/interface';


export async function POST(request: Request) {
  try {
    const body: ICreateAddressService = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.addressLine1 || 
        !body.country || !body.city || !body.state || !body.zip) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Send the request to the backend service
    const data = await fetchInstance('customer/address', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Customer address API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" }, 
      { status: 500 }
    );
  }
}