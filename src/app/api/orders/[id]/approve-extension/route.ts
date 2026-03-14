import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { createNotification } from '@/lib/notifications';

// POST /api/orders/[id]/approve-extension
// Body: { buyerId, action: 'APPROVE' | 'REJECT' }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await context.params;
    const { buyerId, action } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        buyerId: true, 
        sellerId: true, 
        pendingExtensionHours: true, 
        negotiatedDeliveryHours: true,
        product: { select: { title: true } }
      }
    } as any);

    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    if (order.buyerId !== buyerId) return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
    if (!order.pendingExtensionHours) return NextResponse.json({ error: 'Không có yêu cầu gia hạn nào' }, { status: 400 });

    if (action === 'APPROVE') {
      const currentHours = order.negotiatedDeliveryHours || 0;
      const newHours = currentHours + order.pendingExtensionHours;

      await prisma.order.update({
        where: { id: orderId },
        data: { 
          negotiatedDeliveryHours: newHours,
          pendingExtensionHours: null
        } as any
      });

      // Notify Seller
      await sendSystemMessage(
        order.sellerId,
        `✅ Khách hàng đã đồng ý gia hạn thêm ${(order as any).pendingExtensionHours} giờ cho đơn hàng #${orderId.slice(-8).toUpperCase()} (${(order as any).product.title}).`
      );

      await createNotification({
        userId: order.sellerId,
        title: 'Yêu cầu gia hạn đã được duyệt',
        content: `Khách hàng đã đồng ý gia hạn thêm ${(order as any).pendingExtensionHours} giờ cho đơn #${orderId.slice(-8).toUpperCase()}.`,
        type: 'ORDER_UPDATE',
        targetUrl: '/ban-hang/dich-vu'
      });

      return NextResponse.json({ success: true, action: 'APPROVED' });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { pendingExtensionHours: null } as any
      });

      // Notify Seller
      await sendSystemMessage(
        order.sellerId,
        `❌ Khách hàng đã từ chối yêu cầu gia hạn cho đơn hàng #${orderId.slice(-8).toUpperCase()} (${(order as any).product.title}).`
      );

      await createNotification({
        userId: order.sellerId,
        title: 'Yêu cầu gia hạn bị từ chối',
        content: `Khách hàng đã từ chối gia hạn cho đơn #${orderId.slice(-8).toUpperCase()}.`,
        type: 'ORDER_UPDATE',
        targetUrl: '/ban-hang/dich-vu'
      });

      return NextResponse.json({ success: true, action: 'REJECTED' });
    }
  } catch (error) {
    console.error('Approve extension error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
