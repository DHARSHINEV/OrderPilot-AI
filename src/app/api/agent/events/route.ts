import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const orderId = searchParams.get('orderId') || undefined;
    const eventType = searchParams.get('eventType') || undefined;
    const outcome = searchParams.get('outcome') || undefined;

    const events = db.getEvents({ sessionId, orderId, eventType, outcome });
    return NextResponse.json({ success: true, count: events.length, events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve agent events';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
