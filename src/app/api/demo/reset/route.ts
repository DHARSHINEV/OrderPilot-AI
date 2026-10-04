import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const res = db.resetDatabase();
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reset database';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
