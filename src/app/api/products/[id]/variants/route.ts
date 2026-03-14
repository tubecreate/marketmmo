import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/products/[id]/variants
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: { where: { isSold: false } } }
        }
      }
    });
    return NextResponse.json({ variants });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }
}
// POST /api/products/[id]/variants
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const data = await req.json();
    const { name, price, allowBidding, deliveryTimeHours, description } = data;
    
    if (!name || isNaN(parseFloat(price))) {
      return NextResponse.json({ error: 'Invalid name or price' }, { status: 400 });
    }

    const lastVariant = await prisma.productVariant.findFirst({
      where: { productId: id },
      orderBy: { sortOrder: 'desc' }
    });
    
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        name,
        price: parseFloat(price),
        allowBidding: !!allowBidding,
        deliveryTimeHours: deliveryTimeHours ? parseInt(deliveryTimeHours) : null,
        description: description || null,
        sortOrder: (lastVariant?.sortOrder || 0) + 1
      } as any
    });

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create variant' }, { status: 500 });
  }
}
