import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { createNotification } from '@/lib/notifications';
import { broadcastToSocket } from '@/lib/socket-broadcaster';

// POST /api/orders/[id]/accept-bid
// Body: { buyerId }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const { buyerId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true }
    });

    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if (order.buyerId !== buyerId) return NextResponse.json({ error: 'Bạn không có quyền chấp nhận báo giá này' }, { status: 403 });
    if (order.status !== 'NEGOTIATING' || !order.customPrice) {
      return NextResponse.json({ error: 'Đơn hàng không ở trạng thái có thể chấp nhận báo giá' }, { status: 400 });
    }

    const totalAmount = (order as any).customPrice;
    if ((order as any).buyer.balance < totalAmount) {
      return NextResponse.json({ error: `Số dư không đủ. Cần ${totalAmount.toLocaleString('vi-VN')}đ.` }, { status: 400 });
    }

    const platformFee = Math.floor(totalAmount * 0.05);
    const sellerReceives = totalAmount - platformFee;

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          amount: totalAmount,
          fee: platformFee,
          status: 'PENDING_ACCEPTANCE',
        } as any
      }),
      // Deduct from buyer
      prisma.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: totalAmount } }
      }),
      // Add to seller holdBalance
      prisma.user.update({
        where: { id: order.sellerId },
        data: { holdBalance: { increment: sellerReceives } }
      })
    ]);

    // Notify Seller
    await sendSystemMessage(
      order.sellerId,
      `✅ Khách hàng đã chấp nhận báo giá và thanh toán cho đơn #${order.id.slice(-8).toUpperCase()} (${totalAmount.toLocaleString('vi-VN')}đ).\nVui lòng vào chi tiết đơn hàng và ấn BẮT ĐẦU LÀM.`
    );

    await createNotification({
      userId: order.sellerId,
      title: 'Khách chấp nhận báo giá',
      content: `Người mua đã duyệt báo giá và thanh toán cho đơn #${order.id.slice(-8).toUpperCase()}.`,
      type: 'ORDER_UPDATE',
      targetUrl: '/ban-hang/dich-vu'
    });

    // Notify via Socket.io
    broadcastToSocket(`user:${order.buyerId}`, 'order:update', { orderId, status: 'PENDING_ACCEPTANCE' });
    broadcastToSocket(`user:${order.sellerId}`, 'order:update', { orderId, status: 'PENDING_ACCEPTANCE' });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Order accept bid error:', error);
    return NextResponse.json({ error: 'Lỗi server khi chấp nhận báo giá' }, { status: 500 });
  }
}
