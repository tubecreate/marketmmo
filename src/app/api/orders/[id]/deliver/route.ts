import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { createNotification } from '@/lib/notifications';

// POST /api/orders/[id]/deliver
// Body: { sellerId, content }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await context.params;
    const { sellerId, content } = await req.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Nội dung bàn giao không được để trống' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if (order.sellerId !== sellerId) return NextResponse.json({ error: 'Bạn không có quyền bàn giao đơn hàng này' }, { status: 403 });
    if (order.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Đơn hàng không ở trạng thái đang thực hiện' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveredContent: content,
      } as any
    });

    // Notify Buyer
    await sendSystemMessage(
      order.buyerId,
      `🎁 Đơn hàng #${order.id.slice(-8).toUpperCase()} ĐÃ ĐƯỢC BÀN GIAO!\nVui lòng vào chi tiết đơn hàng để xem nội dung và xác nhận hoàn thành để giải ngân cho người bán.`
    );

    await createNotification({
      userId: order.buyerId,
      title: 'Đơn hàng đã bàn giao',
      content: `Người bán đã bàn giao nội dung cho đơn hàng #${order.id.slice(-8).toUpperCase()}.`,
      type: 'ORDER_UPDATE',
      targetUrl: '/tai-khoan/don-hang'
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Order deliver error:', error);
    return NextResponse.json({ error: 'Lỗi server khi bàn giao dịch vụ' }, { status: 500 });
  }
}
