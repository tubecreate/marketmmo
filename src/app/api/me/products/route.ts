import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/me/products?userId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: userId },
      include: {
        category: { select: { id: true, name: true } },
        _count: {
          select: {
            items: { where: { isSold: false } },   // available stock
          }
        },
        variants: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
