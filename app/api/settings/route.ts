import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

// POST handler to SAVE/UPDATE user settings
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const settingsJSON = await request.text();
    // The pathname ensures a unique, overwritable file for each user.
    const pathname = `settings/${userId}-settings.json`;

    // The 'put' function uploads the file to Vercel Blob, overwriting if it exists.
    const blob = await put(pathname, settingsJSON, {
      access: 'public', // 'public' allows the GET handler to fetch it easily.
      contentType: 'application/json',
    });

    return NextResponse.json(blob);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to save settings: ${errorMessage}` }, { status: 500 });
  }
}

// GET handler to LOAD user settings
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const BLOB_STORE_ID = 'tv4s94vxdmxjs44d';
    const pathname = `settings/${userId}-settings.json`;
    const blobUrl = `https://${BLOB_STORE_ID}.public.blob.vercel-storage.com/${pathname}`;
    const response = await fetch(blobUrl, { next: { revalidate: 0 } }); // No caching
    if (!response.ok) {
        // If the file doesn't exist (404), it's a new user. This is not an error.
        if (response.status === 404) {
            return NextResponse.json({ message: 'No settings found for this user.' }, { status: 404 });
        }
        // For other errors, throw to be caught below.
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }
    const settings = await response.json();
    return NextResponse.json(settings);
  } catch (error: any) {
    // Vercel Blob throws a 404 error if the blob is not found.
    // This is an expected condition for a new user, not an error.
    if (error.status === 404) {
      return NextResponse.json({ message: 'No settings found for this user.' }, { status: 404 });
    }
    const errorMessage = error.message || 'Unknown error';
    return NextResponse.json({ error: `Failed to load settings: ${errorMessage}` }, { status: 500 });
  }
} 