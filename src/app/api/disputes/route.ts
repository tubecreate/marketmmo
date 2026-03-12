import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// GET /api/disputes?sellerId=xxx or buyerId=xxx &status=OPEN
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get('sellerId');
  const buyerId = searchParams.get('buyerId');
  const status = searchParams.get('status');

  try {
    const where: { status?: string; order?: { sellerId?: string; buyerId?: string } } = {};
    if (status && status !== 'all') where.status = status;
    
    // Properly handle relations and avoid "undefined" string from frontend
    if (sellerId && sellerId !== 'undefined') {
      where.order = { ...where.order, sellerId };
    }
    if (buyerId && buyerId !== 'undefined') {
      where.order = { ...where.order, buyerId };
    }

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
  } catch (error: any) {
    console.error('[API] Fetch disputes error:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes', details: error.message }, { status: 500 });
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
      select: { id: true, buyerId: true, sellerId: true, status: true, quantity: true, amount: true },
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

    // Send system notifications
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const orderShortId = order.id.slice(-8).toUpperCase();
      
      // Link cho Buyer (Link huỷ khiếu nại nhanh)
      const buyerCancelLink = `${baseUrl}/tai-khoan/don-hang?q=${order.id}&cancelDispute=true`;
      await sendSystemMessage(
        buyerId,
        `⚠️ Bạn đã gửi khiếu nại cho đơn hàng [#${orderShortId}](${baseUrl}/tai-khoan/don-hang?q=${order.id}).\nVui lòng chờ người bán hoặc Admin phản hồi.\n\n🔗 [Bấm vào đây để HUỶ KHIẾU NẠI](${buyerCancelLink})`
      );

      // Link cho Seller (Link xử lý khiếu nại)
      const sellerManageLink = `${baseUrl}/ban-hang/khieu-nai?q=${order.id}`;
      await sendSystemMessage(
        order.sellerId,
        `🚨 Đơn hàng [#${orderShortId}](${sellerManageLink}) vừa bị khiếu nại!\nVui lòng kiểm tra và xử lý sớm.\n\n🔗 [Xử lý khiếu nại ngay](${sellerManageLink})`
      );
    } catch (e) {
      console.error('Failed to notify users about dispute via chat', e);
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi tạo khiếu nại';
    console.error('Create dispute error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
