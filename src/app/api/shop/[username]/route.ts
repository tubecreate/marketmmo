import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const trimmedUsername = username.trim();

    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: trimmedUsername,
        }
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            sellerOrders: true,
            products: { where: { status: { in: ['ACTIVE', 'CLOSED'] } } }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: user.id,
        status: { in: ['ACTIVE', 'CLOSED'] }
      },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      seller: user,
      products
    });
  } catch (error: any) {
    console.error('Fetch shop error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
