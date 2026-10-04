import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const reviewer = body.reviewer || 'Store Reviewer (Human-in-the-Loop)';
    const notes = body.notes || 'Verified stock and customer details.';

    const approvedOrder = db.approveOrderAtomically(params.id, reviewer, notes);

    return NextResponse.json({
      success: true,
      message: `Order ${params.id} successfully approved. Inventory decremented.`,
      order: approvedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to approve order';
    return NextResponse.json(
      { error: message, blocked: true },
      { status: 400 }
    );
  }
}
