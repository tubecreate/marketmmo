import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // DIGITAL | SERVICE
  const categorySlug = searchParams.get('category');
  const featured = searchParams.get('featured') === '1';
  const sponsored = searchParams.get('sponsored') === '1';
  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 999999999);
  const inStockOnly = searchParams.get('inStockOnly') === '1';
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const limit = Number(searchParams.get('limit') || 20);
  const page = Number(searchParams.get('page') || 1);

  const where: any = { status: 'ACTIVE' };
  
  if (type) where.type = type;
  if (featured) where.isFeatured = true;
  if (sponsored) where.isSponsored = true;

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { seller: { username: { contains: q } } }
    ];
  }
  
  // Price filtering
  where.price = { gte: minPrice, lte: maxPrice };

  // Category filtering (including children)
  if (categorySlug) {
    const targetCategory = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } }
    });

    if (targetCategory) {
      if (targetCategory.children.length > 0) {
        // It's a parent, include all children IDs + parent ID
        const catIds = [targetCategory.id, ...targetCategory.children.map(c => c.id)];
        where.categoryId = { in: catIds };
      } else {
        // Single category
        where.categoryId = targetCategory.id;
      }
    }
  }

  // Stock status
  if (inStockOnly) {
    where.items = { some: { status: 'AVAILABLE' } };
  }

  // Sorting
  let orderBy: any = [];
  switch (sort) {
    case 'bestseller':
      orderBy = [{ soldCount: 'desc' }];
      break;
    case 'price_asc':
      orderBy = [{ price: 'asc' }];
      break;
    case 'price_desc':
      orderBy = [{ price: 'desc' }];
      break;
    case 'newest':
    default:
      orderBy = [{ createdAt: 'desc' }];
  }

  // Always prioritize sponsored items
  orderBy.unshift({ isSponsored: 'desc' });

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { 
        seller: { select: { username: true, isActive: true, insuranceBalance: true } }, 
        category: { select: { name: true, slug: true } } 
      },
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}
