import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    let products = search ? db.searchProducts(search) : db.getProducts();

    if (category && category !== 'All') {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (lowStockOnly) {
      products = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);
    }

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, name, category, description, price, stock_quantity, low_stock_threshold, variants } = body;

    if (!sku || !name || !category || price === undefined || stock_quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required product fields: sku, name, category, price, stock_quantity.' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json({ error: 'Product price cannot be negative.' }, { status: 400 });
    }

    if (stock_quantity < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative.' }, { status: 400 });
    }

    const existingSku = db.getProductBySku(sku);
    if (existingSku) {
      return NextResponse.json({ error: `Product with SKU "${sku}" already exists.` }, { status: 409 });
    }

    const newProduct = db.createProduct({
      sku,
      name,
      category,
      description: description || '',
      price: Number(price),
      stock_quantity: Number(stock_quantity),
      low_stock_threshold: Number(low_stock_threshold || 5),
      variants: Array.isArray(variants) ? variants : typeof variants === 'string' ? variants.split(',').map((v) => v.trim()).filter(Boolean) : [],
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
