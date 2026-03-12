import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/disputes?sellerId=xxx or buyerId=xxx &status=OPEN
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get('sellerId');
  const buyerId = searchParams.get('buyerId');
  const status = searchParams.get('status');

  try {
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (sellerId) where.order = { sellerId };
    if (buyerId) where.order = { buyerId };

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        order: {
          include: {
            product: { select: { id: true, title: true, thumbnail: true } },
            buyer: { select: { id: true, username: true } },
            seller: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('Fetch disputes error:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

// POST /api/disputes - Buyer creates a dispute
export async function POST(req: Request) {
  try {
    const { orderId, reason, evidence, faultyCount, buyerId } = await req.json();

    if (!orderId || !reason || !buyerId) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Verify order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, status: true, quantity: true, amount: true },
    });

    if (!order) return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
    if (order.buyerId !== buyerId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    if (!['HOLDING', 'COMPLETED'].includes(order.status)) {
      return NextResponse.json({ error: 'Đơn hàng không ở trạng thái có thể khiếu nại' }, { status: 400 });
    }

    // Check existing dispute
    const existing = await prisma.dispute.findUnique({ where: { orderId } });
    if (existing) return NextResponse.json({ error: 'Đơn hàng đã có khiếu nại' }, { status: 400 });

    // Create dispute & update order status
    const [dispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: {
          orderId,
          reason,
          evidence: evidence || null,
          faultyCount: Number(faultyCount) || 0,
          status: 'OPEN',
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'DISPUTED' },
      }),
    ]);

    return NextResponse.json({ success: true, dispute });
  } catch (error: any) {
    console.error('Create dispute error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi tạo khiếu nại' }, { status: 500 });
  }
}
