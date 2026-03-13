import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// POST /api/orders/[id]/cancel-preorder
// Body: { buyerId }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await context.params;
    const { buyerId } = await req.json();

    if (!buyerId) {
      return NextResponse.json({ error: 'Thiếu thông tin người mua' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
    if (order.buyerId !== buyerId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    if (order.status !== 'PRE_ORDER') return NextResponse.json({ error: 'Chỉ có thể huỷ đơn đặt trước' }, { status: 400 });

    const platformFee = order.fee;
    const sellerReceives = order.amount - platformFee;

    await prisma.$transaction([
      // Update order status
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      }),
      // Refund buyer
      prisma.user.update({
        where: { id: buyerId },
        data: { balance: { increment: order.amount } },
      }),
      // Deduct from seller holdBalance
      prisma.user.update({
        where: { id: order.sellerId },
        data: { holdBalance: { decrement: sellerReceives } },
      }),
    ]);

    // Notify seller
    try {
      await sendSystemMessage(
        order.sellerId,
        `❌ Đơn đặt trước #${orderId.slice(-8).toUpperCase()} đã bị người mua huỷ. Số tiền tạm giữ đã được trả lại.`
      );
    } catch (e) {
      console.error('Failed to notify seller about pre-order cancellation', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Cancel pre-order error:', error);
    return NextResponse.json({ error: 'Lỗi huỷ đặt trước' }, { status: 500 });
  }
}
