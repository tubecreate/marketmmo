import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json({ products: [] });

  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: q } },
          { seller: { username: { contains: q } } },
          { category: { name: { contains: q } } },
        ]
      },
      include: {
        category: { select: { name: true, slug: true } },
        seller: { select: { username: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
