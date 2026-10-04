import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = db.getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: `Order ${params.id} not found` }, { status: 404 });
    }
    const approvals = db.getApprovals(params.id);
    return NextResponse.json({ success: true, order, approvals });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = db.updateOrder(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: `Order ${params.id} not found` }, { status: 404 });
    }

    db.recordEvent({
      session_id: `sess-${params.id}`,
      order_id: params.id,
      event_type: 'human_action',
      tool_name: 'edit_draft_order',
      outcome: 'info',
      safe_summary: `Order ${params.id} details edited by human reviewer.`,
      actor: 'human',
      details: { modified_fields: Object.keys(body) },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = db.deleteOrder(params.id);
    if (!success) {
      return NextResponse.json({ error: `Order ${params.id} not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Order ${params.id} deleted` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
