import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { createNotification } from '@/lib/notifications';
import { broadcastToSocket } from '@/lib/socket-broadcaster';

// POST /api/orders/[id]/bid
// Body: { sellerId, price }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const { sellerId, price, deliveryHours } = await req.json();

    if (!sellerId || !price || price <= 0) {
      return NextResponse.json({ error: 'Thông tin báo giá không hợp lệ' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    });

    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if ((order as any).sellerId !== sellerId) return NextResponse.json({ error: 'Bạn không có quyền báo giá cho đơn hàng này' }, { status: 403 });
    if (order.status !== 'NEGOTIATING') return NextResponse.json({ error: 'Đơn hàng không ở trạng thái thương lượng' }, { status: 400 });

    // Update the order with customPrice
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customPrice: parseFloat(price),
        negotiatedDeliveryHours: deliveryHours ? parseInt(deliveryHours) : null,
      } as any
    });

    // Notify Buyer
    const timeInfo = deliveryHours ? ` trong **${deliveryHours} giờ**` : '';
    await sendSystemMessage(
      order.buyerId,
      `💰 Người bán đã gửi báo giá cho đơn #${order.id.slice(-8).toUpperCase()}: **${parseFloat(price).toLocaleString('vi-VN')}đ**${timeInfo}.\nVui lòng vào chi tiết đơn hàng để Chấp nhận và Thanh toán.`
    );

    await createNotification({
      userId: order.buyerId,
      title: 'Báo giá dịch vụ mới',
      content: `Người bán đã gửi báo giá ${parseFloat(price).toLocaleString('vi-VN')}đ cho đơn #${order.id.slice(-8).toUpperCase()}.`,
      type: 'ORDER_UPDATE',
      targetUrl: '/tai-khoan/don-hang'
    });

    // Notify via Socket.io
    broadcastToSocket(`user:${order.buyerId}`, 'order:update', { orderId, status: 'NEGOTIATING' });
    broadcastToSocket(`user:${order.sellerId}`, 'order:update', { orderId, status: 'NEGOTIATING' });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Order bid error:', error);
    return NextResponse.json({ error: 'Lỗi server khi gửi báo giá' }, { status: 500 });
  }
}
