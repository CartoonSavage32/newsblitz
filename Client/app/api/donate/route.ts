import { NextResponse } from 'next/server';

// Dummy donation endpoint - kept for backward compatibility
export async function POST(request: Request) {
  try {
    const donationData = await request.json();

    if (!donationData.amount || !donationData.frequency || !donationData.donorInfo?.email) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, frequency, and donor email are required' },
        { status: 400 }
      );
    }

    // Dummy transaction - just log it
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log('Donation received:', {
      transactionId,
      amount: donationData.amount,
      frequency: donationData.frequency,
      donor: donationData.donorInfo,
      paymentMethod: donationData.paymentMethod,
      timestamp: donationData.timestamp,
    });

    return NextResponse.json({
      message: 'Donation processed successfully',
      transactionId,
      amount: donationData.amount,
      frequency: donationData.frequency,
    });
  } catch (error) {
    console.error('Donation processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

