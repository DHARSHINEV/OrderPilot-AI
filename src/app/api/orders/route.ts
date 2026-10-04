import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const status = searchParams.get('status') as OrderStatus | null;
    const sort = searchParams.get('sort') || 'newest';

    let orders = db.getOrders();

    if (status && status !== ('all' as any)) {
      orders = orders.filter((o) => o.status === status);
    }

    if (search) {
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(search) ||
          o.customer_name.toLowerCase().includes(search) ||
          (o.delivery_address && o.delivery_address.toLowerCase().includes(search)) ||
          o.items.some((i) => i.product_name_snapshot.toLowerCase().includes(search))
      );
    }

    if (sort === 'oldest') {
      orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'highest_total') {
      orders.sort((a, b) => b.total - a.total);
    } else {
      // Default: newest first
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customer_name || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Customer name and line items are required.' }, { status: 400 });
    }

    const newOrder = db.createOrder({
      ...body,
      id: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
