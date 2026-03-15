import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { 
        id: true, 
        name: true, 
        slug: true, 
        parentId: true,
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } }
          }
        }
      },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
