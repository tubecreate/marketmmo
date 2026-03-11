import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/products/[id]/stock?isSold=false&variantId=xxx
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const isSoldParam = searchParams.get('isSold');
  const variantId = searchParams.get('variantId'); // optional filter

  const where: Record<string, unknown> = { productId: id };
  if (isSoldParam !== null) where.isSold = isSoldParam === 'true';
  if (variantId) where.variantId = variantId;

  try {
    const items = await prisma.productItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/products/[id]/stock  { contentLines: string[], variantId?: string }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const { contentLines, variantId } = await req.json();

    if (!contentLines || !Array.isArray(contentLines)) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const lines = contentLines.filter(l => typeof l === 'string' && l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'No valid lines' }, { status: 400 });
    }

    // Validate variant belongs to this product if provided
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId: id } });
      if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    await prisma.productItem.createMany({
      data: lines.map(line => ({
        productId: id,
        variantId: variantId || null,
        content: line.trim(),
      })),
    });

    return NextResponse.json({ success: true, count: lines.length });
  } catch {
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 });
  }
}

// DELETE /api/products/[id]/stock?itemId=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
  try {
    const item = await prisma.productItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (item.isSold) return NextResponse.json({ error: 'Cannot delete sold items' }, { status: 400 });
    await prisma.productItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
