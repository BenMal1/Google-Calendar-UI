import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const BLOB_STORE_ID = process.env.BLOB_STORE_ID || '';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const googleId = searchParams.get('googleId');
  if (!googleId) return NextResponse.json({ error: 'Google ID is required' }, { status: 400 });

  try {
    const settingsJSON = await request.text();
    const pathname = `settings/${googleId}-settings.json`;
    const blob = await put(pathname, settingsJSON, { access: 'public', contentType: 'application/json' });
    return NextResponse.json(blob);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const googleId = searchParams.get('googleId');
  if (!googleId) return NextResponse.json({ error: 'Google ID is required' }, { status: 400 });

  try {
    const pathname = `settings/${googleId}-settings.json`;
    const blobUrl = `https://${BLOB_STORE_ID}.public.blob.vercel-storage.com/${pathname}`;
    const response = await fetch(blobUrl, { next: { revalidate: 0 } });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: 'No settings found for this user.' }, { status: 404 });
      }
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }
    const settings = await response.json();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 