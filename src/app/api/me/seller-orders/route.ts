import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/me/seller-orders?userId=xxx&status=all
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const where: Record<string, any> = { sellerId: userId };
  if (status && status !== 'all') {
    where.status = status;
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        product: { select: { title: true, slug: true, thumbnail: true } },
        buyer: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch seller orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
