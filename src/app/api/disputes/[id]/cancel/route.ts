import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// POST /api/disputes/[id]/cancel
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: disputeId } = await params;
    const { buyerId } = await req.json();

    if (!buyerId) {
      return NextResponse.json({ error: 'Thiếu thông tin người mua' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findFirst({
      where: {
        OR: [
          { id: disputeId },
          { orderId: disputeId }
        ]
      },
      include: { order: true }
    });

    if (!dispute) return NextResponse.json({ error: 'Khiếu nại không tồn tại' }, { status: 404 });
    if (dispute.order.buyerId !== buyerId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    if (dispute.status !== 'OPEN') return NextResponse.json({ error: 'Khiếu nại không ở trạng thái có thể huỷ' }, { status: 400 });

    // Revert order status
    // Check if warranty expired to decide if COMPLETED or HOLDING
    const newStatus = dispute.order.warrantyExpire && new Date(dispute.order.warrantyExpire) < new Date() 
      ? 'COMPLETED' 
      : 'HOLDING';

    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: 'CLOSED', resolution: 'CANCELED_BY_BUYER', resolvedAt: new Date() }
      }),
      prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: newStatus }
      })
    ]);

    // Notify seller
    try {
      await sendSystemMessage(
        dispute.order.sellerId,
        `✅ Khiếu nại cho đơn hàng #${dispute.order.id.slice(-8).toUpperCase()} đã được người mua huỷ bỏ.`
      );
    } catch (e) {
      console.error('Failed to notify seller about dispute cancellation', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Cancel dispute error:', error);
    return NextResponse.json({ error: 'Lỗi huỷ khiếu nại' }, { status: 500 });
  }
}
