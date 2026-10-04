import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = db.getSettings();
    // Mask API key for security
    const maskedKey = settings.api_key
      ? `${settings.api_key.substring(0, 4)}...${settings.api_key.substring(settings.api_key.length - 4)}`
      : '';
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        has_api_key: Boolean(settings.api_key),
        api_key_masked: maskedKey,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = db.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
