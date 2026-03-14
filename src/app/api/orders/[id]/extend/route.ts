import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// POST /api/orders/[id]/extend
// Body: { sellerId, hours }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await context.params;
    const { sellerId, hours } = await req.json();

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Số giờ gia hạn không hợp lệ' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { sellerId: true, negotiatedDeliveryHours: true, product: { select: { title: true } } }
    } as any);

    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if (order.sellerId !== sellerId) return NextResponse.json({ error: 'Bạn không có quyền gia hạn đơn hàng này' }, { status: 403 });

    const currentHours = order.negotiatedDeliveryHours || 0;
    const newHours = currentHours + parseInt(hours);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { pendingExtensionHours: parseInt(hours) } as any
    });

    console.log('Order found:', order);
    console.log('Updated order:', updatedOrder);

    // Notify Buyer
    await sendSystemMessage(
      (updatedOrder as any).buyerId,
      `🕒 Người bán đã gửi yêu cầu gia hạn thêm ${hours} giờ thực hiện cho đơn hàng #${orderId.slice(-8).toUpperCase()} (${(order as any).product.title}). Vui lòng vào trang Đơn hàng để xác nhận.`
    );

    return NextResponse.json({ success: true, pendingHours: hours });
  } catch (error) {
    console.error('Order extend error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    return NextResponse.json({ error: 'Lỗi server khi gia hạn: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
