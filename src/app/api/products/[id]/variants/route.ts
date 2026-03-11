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
