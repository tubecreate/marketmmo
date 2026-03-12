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
        buyer: { select: { id: true, username: true } },
      },
      // deliveredContent and warrantyExpire are base fields of Order, they are included by default 
      // when using findMany on Order without a specific select block. 
      // But wait, findMany with include returns all fields + relations.
      // So deliveredContent should already be there. 
      // Let me check prisma schema again. Yes, they are fields of Order.
      // I don't need to add them to 'include'. they are there.
      // Ah, but I should probably check if my previous code in the frontend was expecting them.
      // Let's just make it explicit if I'm unsure, but findMany returns all fields.

      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch seller orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
