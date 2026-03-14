import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { createNotification } from '@/lib/notifications';

// POST /api/orders/[id]/accept-service
// Body: { sellerId }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await context.params;
    const { sellerId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if (order.sellerId !== sellerId) return NextResponse.json({ error: 'Bạn không có quyền xác nhận đơn hàng này' }, { status: 403 });
    if (order.status !== 'PENDING_ACCEPTANCE') {
      return NextResponse.json({ error: 'Đơn hàng không ở trạng thái chờ xác nhận' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      } as any
    });

    // Notify Buyer
    await sendSystemMessage(
      order.buyerId,
      `👷 Người bán đã BẮT ĐẦU THỰC HIỆN đơn hàng #${order.id.slice(-8).toUpperCase()} của bạn.\nThời gian bắt đầu được tính từ bây giờ.`
    );

    await createNotification({
      userId: order.buyerId,
      title: 'Dịch vụ đang thực hiện',
      content: `Người bán đã xác nhận và bắt đầu làm đơn hàng #${order.id.slice(-8).toUpperCase()}.`,
      type: 'ORDER_UPDATE',
      targetUrl: '/tai-khoan/don-hang'
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Order accept service error:', error);
    return NextResponse.json({ error: 'Lỗi server khi xác nhận bắt đầu dịch vụ' }, { status: 500 });
  }
}
