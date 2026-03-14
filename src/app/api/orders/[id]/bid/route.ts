import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// POST /api/orders/[id]/bid
// Body: { sellerId, price }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await context.params;
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

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Order bid error:', error);
    return NextResponse.json({ error: 'Lỗi server khi gửi báo giá' }, { status: 500 });
  }
}
