import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Rejected by reviewer during human approval review.';
    const reviewer = body.reviewer || 'Store Reviewer';

    const rejectedOrder = db.rejectOrder(params.id, reason, reviewer);

    return NextResponse.json({
      success: true,
      message: `Order ${params.id} has been rejected.`,
      order: rejectedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
