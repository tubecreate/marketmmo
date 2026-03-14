import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/me/orders?userId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  if (!userId || userId === 'undefined') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const where: Record<string, unknown> = { buyerId: userId };
  if (status && status !== 'all') where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: {
      product: { select: { id: true, title: true, slug: true, type: true, thumbnail: true, isService: true, deliveryTimeHours: true } },
      seller: { select: { id: true, username: true } },
      dispute: { select: { id: true, status: true } },
      review: { select: { rating: true, comment: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}
