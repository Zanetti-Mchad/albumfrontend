import { NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://albumbackend-production-7eed.up.railway.app/api/v1';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/integration/family-trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.status?.returnMessage || 'Failed to save family tree'
      );
    }

    return NextResponse.json({
      success: true,
      message: data.status?.returnMessage || data.message || 'Family tree saved successfully',
      data: data.data,
    });
  } catch (error) {
    console.error('Error saving family tree:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save family tree',
      },
      { status: 500 }
    );
  }
}
