import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = db.getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: `Product ${params.id} not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative.' }, { status: 400 });
    }
    if (body.stock_quantity !== undefined && body.stock_quantity < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative.' }, { status: 400 });
    }

    const currentProd = db.getProductById(params.id);
    if (!currentProd) {
      return NextResponse.json({ error: `Product ${params.id} not found` }, { status: 404 });
    }

    const oldStock = currentProd.stock_quantity;
    const updated = db.updateProduct(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: `Product ${params.id} not found` }, { status: 404 });
    }

    if (body.stock_quantity !== undefined && body.stock_quantity !== oldStock) {
      db.recordEvent({
        session_id: 'manual-stock-adjust',
        event_type: 'human_action',
        tool_name: 'adjust_inventory_stock',
        actor: 'human',
        outcome: 'success',
        safe_summary: `Manual stock adjustment for "${updated.name}" (${updated.sku}): ${oldStock} → ${updated.stock_quantity} units. Reason: ${body.reason || 'Manual inventory update'}.`,
        details: {
          product_id: params.id,
          old_stock: oldStock,
          new_stock: updated.stock_quantity,
          reason: body.reason,
        },
      });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = db.deleteProduct(params.id);
    if (!deleted) {
      return NextResponse.json({ error: `Product ${params.id} not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Product ${params.id} deleted successfully` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
