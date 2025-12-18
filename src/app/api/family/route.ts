import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4210/api/v1';

async function getAuthToken() {
  if (typeof window !== 'undefined') {
    // Client-side: Get token from localStorage or your auth context
    return localStorage.getItem('token') || '';
  }
  
  // Server-side: Get token from request headers
  const headersList = await headers();
  return headersList.get('authorization')?.replace('Bearer ', '') || '';
}

export async function PUT(request: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { familyName, familyBio, familyPhoto } = await request.json();

    console.log('Sending to backend:', { familyName, familyBio, familyPhoto: familyPhoto ? 'URL present' : 'No URL' });
    
    const response = await fetch(`${API_URL}/settings/family`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        familyName,
        familyBio,
        familyPhoto
      })
    });

    const data = await response.json();
    console.log('Backend response:', data);

    if (!response.ok) {
      console.error('Backend error:', data);
      throw new Error(data.status?.returnMessage || 'Failed to update family profile');
    }

    return NextResponse.json({ 
      success: true,
      message: data.status?.returnMessage || 'Family profile updated successfully',
      data: data.data
    });
  } catch (error) {
    console.error('Error updating family profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update family profile' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const token = await getAuthToken();
    const isPublic = !token;
    
    const endpoint = isPublic 
      ? '/settings/family/public' 
      : '/settings/family';

    const response = await fetch(
      `${API_URL}${endpoint}`, 
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status?.returnMessage || 'Failed to fetch family profile');
    }

    return NextResponse.json({ 
      success: true,
      data: data.data || data,
      message: data.status?.returnMessage
    });
  } catch (error) {
    console.error('Error fetching family profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch family profile' 
      },
      { status: 500 }
    );
  }
}
