import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // DIGITAL | SERVICE
  const categorySlug = searchParams.get('category');
  const featured = searchParams.get('featured') === '1';
  const sponsored = searchParams.get('sponsored') === '1';
  const limit = Number(searchParams.get('limit') || 20);
  const page = Number(searchParams.get('page') || 1);

  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (type) where.type = type;
  if (featured) where.isFeatured = true;
  if (sponsored) where.isSponsored = true;
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { seller: { select: { username: true, isActive: true } }, category: { select: { name: true, slug: true } } },
      orderBy: [{ isSponsored: 'desc' }, { soldCount: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}
