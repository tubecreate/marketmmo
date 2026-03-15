import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { createNotification } from '@/lib/notifications';
import { broadcastToSocket } from '@/lib/socket-broadcaster';

// POST /api/orders/[id]/cancel
// Body: { userId, role }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Thiếu thông tin người dùng hoặc vai trò' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        buyer: true,
        seller: true
      }
    });

    if (!order) return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });

    // Permissions & State Validation
    if (role === 'SELLER') {
      if (order.sellerId !== userId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
      // Seller can cancel if PENDING_ACCEPTANCE or IN_PROGRESS
      if (!['PENDING_ACCEPTANCE', 'IN_PROGRESS'].includes(order.status)) {
        return NextResponse.json({ error: 'Không thể huỷ đơn ở trạng thái này' }, { status: 400 });
      }
    } else if (role === 'BUYER') {
      if (order.buyerId !== userId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
      
      const isPending = order.status === 'PENDING_ACCEPTANCE';
      
      // Calculate if overdue
      const deliveryHours = order.negotiatedDeliveryHours || order.product.deliveryTimeHours || 0;
      const isOverdue = order.status === 'IN_PROGRESS' && order.startedAt && 
                        (new Date().getTime() - new Date(order.startedAt).getTime() > deliveryHours * 3600000);

      if (!isPending && !isOverdue) {
        return NextResponse.json({ error: 'Chỉ có thể huỷ đơn khi chờ xác nhận hoặc quá hạn' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    }

    const platformFee = order.fee;
    const sellerReceives = order.amount - platformFee;

    // Execute Refund Transaction
    await prisma.$transaction([
      // 1. Update order status
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      }),
      // 2. Refund buyer (always return the full amount paid)
      prisma.user.update({
        where: { id: order.buyerId },
        data: { balance: { increment: order.amount } },
      }),
      // 3. Deduct from seller holdBalance
      prisma.user.update({
        where: { id: order.sellerId },
        data: { holdBalance: { decrement: sellerReceives } },
      }),
    ]);

    // Notifications & Broadcasting
    const cancelerRoleName = role === 'SELLER' ? 'Người bán' : 'Người mua';
    const targetUserId = role === 'SELLER' ? order.buyerId : order.sellerId;
    const orderTitle = order.id.slice(-8).toUpperCase();

    try {
      // System Messages
      await sendSystemMessage(
        order.buyerId,
        `❌ Đơn hàng #${orderTitle} đã bị huỷ bởi ${cancelerRoleName}. Số tiền ${order.amount.toLocaleString('vi-VN')}đ đã được hoàn lại vào số dư của bạn.`
      );
      await sendSystemMessage(
        order.sellerId,
        `❌ Đơn hàng #${orderTitle} đã bị huỷ bởi ${cancelerRoleName}. Số tiền tạm giữ đã được giải toả/hoàn về cho khách.`
      );

      // Notifications
      await createNotification({
        userId: targetUserId,
        title: 'Đơn hàng bị huỷ',
        content: `${cancelerRoleName} đã huỷ đơn dịch vụ #${orderTitle}.`,
        type: 'ORDER_UPDATE',
        targetUrl: role === 'SELLER' ? '/tai-khoan/don-hang' : '/ban-hang/dich-vu'
      });

      // Socket.io Broadcast
      broadcastToSocket(`user:${order.buyerId}`, 'order:update', { orderId, status: 'CANCELLED' });
      broadcastToSocket(`user:${order.sellerId}`, 'order:update', { orderId, status: 'CANCELLED' });
    } catch (e) {
      console.error('Failed to notify about order cancellation', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Lỗi khi xử lý huỷ đơn hàng' }, { status: 500 });
  }
}
