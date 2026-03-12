import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/disputes/[id]/admin-resolve
// Body: { adminId, decision: 'REFUND_BUYER' | 'SIDE_SELLER', adminMessage? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: disputeId } = await params;
    const { adminId, decision, adminMessage } = await req.json();

    if (!adminId || !decision) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    // Verify admin role
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền admin' }, { status: 403 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true },
    });

    if (!dispute) return NextResponse.json({ error: 'Không tìm thấy khiếu nại' }, { status: 404 });
    if (dispute.status !== 'ESCALATED') {
      return NextResponse.json({ error: 'Tranh chấp không ở trạng thái ESCALATED' }, { status: 400 });
    }

    const order = dispute.order;
    const faultyCount = dispute.faultyCount || 1;
    const unitPrice = order.amount / (order.quantity || 1);
    const refundAmount = unitPrice * faultyCount;

    if (decision === 'REFUND_BUYER') {
      // Admin sides with buyer → refund
      await prisma.$transaction([
        prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: 'RESOLVED',
            adminDecision: `Hoàn tiền cho người mua: ${refundAmount.toLocaleString('vi-VN')}đ`,
            refundAmount,
            resolvedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: order.sellerId },
          data: { holdBalance: { decrement: refundAmount } },
        }),
        prisma.user.update({
          where: { id: order.buyerId },
          data: { balance: { increment: refundAmount } },
        }),
        prisma.transaction.create({
          data: {
            userId: order.buyerId,
            amount: refundAmount,
            type: 'REFUND',
            status: 'SUCCESS',
            description: `Admin hoàn tiền tranh chấp - Đơn #${order.id.slice(-8)}`,
          },
        }),
        prisma.disputeMessage.create({
          data: {
            disputeId,
            senderId: adminId,
            senderRole: 'ADMIN',
            message: adminMessage || `🔨 Admin đã quyết định hoàn tiền ${refundAmount.toLocaleString('vi-VN')}đ cho người mua. Tranh chấp đã đóng.`,
          },
        }),
      ]);
    } else if (decision === 'SIDE_SELLER') {
      // Admin sides with seller → release funds, close dispute
      const sellerReceives = order.amount - order.fee;
      await prisma.$transaction([
        prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: 'RESOLVED',
            adminDecision: 'Quyết định có lợi cho người bán',
            resolvedAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        }),
        prisma.user.update({
          where: { id: order.sellerId },
          data: {
            holdBalance: { decrement: sellerReceives },
            balance: { increment: sellerReceives },
            totalRevenue: { increment: sellerReceives },
          },
        }),
        prisma.disputeMessage.create({
          data: {
            disputeId,
            senderId: adminId,
            senderRole: 'ADMIN',
            message: adminMessage || '🔨 Admin đã quyết định có lợi cho người bán. Tiền đã được giải phóng. Tranh chấp đã đóng.',
          },
        }),
      ]);
    }

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    console.error('Admin resolve error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý' }, { status: 500 });
  }
}
