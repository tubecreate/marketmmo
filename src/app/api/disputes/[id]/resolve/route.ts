import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// POST /api/disputes/[id]/resolve
// Body: { resolution: 'REFUND' | 'WARRANTY' | 'DISPUTE', sellerId, sellerReply? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: disputeId } = await params;
    const { resolution, sellerId, sellerReply } = await req.json();

    if (!resolution || !sellerId) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findFirst({
      where: {
        OR: [
          { id: disputeId },
          { orderId: disputeId }
        ]
      },
      include: {
        order: {
          include: {
            product: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!dispute) return NextResponse.json({ error: 'Khiếu nại không tồn tại' }, { status: 404 });
    if (dispute.order.sellerId !== sellerId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    if (dispute.status !== 'OPEN') return NextResponse.json({ error: 'Khiếu nại đã được xử lý' }, { status: 400 });

    const order = dispute.order;
    const faultyCount = dispute.faultyCount || 1;
    const unitPrice = order.amount / (order.quantity || 1);
    const refundAmount = unitPrice * faultyCount;

    if (resolution === 'REFUND') {
      // Refund: chuyển tiền từ seller → buyer
      await prisma.$transaction([
        prisma.dispute.update({
          where: { id: dispute.id },
          data: { status: 'REFUNDED', resolution: 'REFUND', sellerReply, refundAmount, resolvedAt: new Date() },
        }),
        // Update order status
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'REFUNDED' },
        }),
        // Decrease seller balance/holdBalance
        prisma.user.update({
          where: { id: order.sellerId },
          data: {
            holdBalance: { decrement: refundAmount },
          },
        }),
        // Increase buyer balance
        prisma.user.update({
          where: { id: order.buyerId },
          data: { balance: { increment: refundAmount } },
        }),
        // Create refund transaction for buyer
        prisma.transaction.create({
          data: {
            userId: order.buyerId,
            amount: refundAmount,
            type: 'REFUND',
            status: 'SUCCESS',
            description: `Hoàn tiền ${faultyCount} items lỗi - Đơn #${order.id.slice(-8)}`,
          },
        }),
      ]);

      return NextResponse.json({ success: true, resolution: 'REFUND', refundAmount });

    } else if (resolution === 'WARRANTY') {
      // Warranty: lấy items từ kho cùng variant, giao cho buyer
      const variantName = order.variantName;
      
      // Find variant by name (since we store name in order)
      let variantId: string | null = null;
      if (variantName && variantName !== 'Kho chung') {
        const variant = await prisma.productVariant.findFirst({
          where: { productId: order.productId, name: variantName },
        });
        variantId = variant?.id || null;
      }

      // Get available stock items
      const stockItems = await prisma.productItem.findMany({
        where: {
          productId: order.productId,
          variantId: variantId,
          isSold: false,
        },
        take: faultyCount,
        orderBy: { createdAt: 'asc' },
      });

      if (stockItems.length < faultyCount) {
        return NextResponse.json({
          error: `Không đủ hàng trong kho để bảo hành. Cần ${faultyCount}, còn ${stockItems.length}.`,
        }, { status: 400 });
      }

      // Mark items as sold and append to delivered content
      const newContent = stockItems.map(i => i.content).join('\n');
      const updatedDelivered = order.deliveredContent
        ? `${order.deliveredContent}\n--- BẢO HÀNH (${new Date().toLocaleDateString('vi-VN')}) ---\n${newContent}`
        : newContent;

      await prisma.$transaction([
        prisma.dispute.update({
          where: { id: dispute.id },
          data: { status: 'WARRANTY', resolution: 'WARRANTY', sellerReply, resolvedAt: new Date() },
        }),
        // Mark stock items as sold
        ...stockItems.map(item =>
          prisma.productItem.update({
            where: { id: item.id },
            data: { isSold: true, soldAt: new Date() },
          })
        ),
        // Update order delivered content and revert status
        prisma.order.update({
          where: { id: order.id },
          data: { 
            deliveredContent: updatedDelivered,
            status: order.warrantyExpire && new Date(order.warrantyExpire) < new Date() ? 'COMPLETED' : 'HOLDING'
          },
        }),
      ]);

      return NextResponse.json({ success: true, resolution: 'WARRANTY', replacedCount: stockItems.length, newContent });

    } else if (resolution === 'DISPUTE') {
      // Escalate to 3-way chat
      await prisma.$transaction([
        prisma.dispute.update({
          where: { id: dispute.id },
          data: { status: 'ESCALATED', resolution: 'DISPUTE', sellerReply },
        }),
        // Create initial system message in dispute room
        prisma.disputeMessage.create({
          data: {
            disputeId: dispute.id,
            senderId: sellerId,
            senderRole: 'SELLER',
            message: sellerReply || 'Người bán yêu cầu tranh chấp. Admin sẽ xem xét và xử lý.',
          },
        }),
      ]);

      // Notify via Chatbot with direct links
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const orderShortId = order.id.slice(-8).toUpperCase();
        
        // Link cho Buyer
        const buyerDisputeLink = `${baseUrl}/tai-khoan/khieu-nai/${dispute.id}`;
        await sendSystemMessage(
          order.buyerId,
          `⚖️ Khiếu nại đơn hàng #${orderShortId} đã được chuyển thành TRANH CHẤP.\nAdmin đã tham gia vào phòng hỗ trợ.\n\n🔗 Vào phòng tranh chấp: ${buyerDisputeLink}`
        );

        // Link cho Seller
        const sellerDisputeLink = `${baseUrl}/ban-hang/khieu-nai/${dispute.id}`;
        await sendSystemMessage(
          order.sellerId,
          `⚖️ Đơn hàng #${orderShortId} đã được chuyển sang trạng thái TRANH CHẤP.\n\n🔗 Vào phòng tranh chấp: ${sellerDisputeLink}`
        );
      } catch (e) {
        console.error('Failed to notify users about escalation', e);
      }

      return NextResponse.json({ success: true, resolution: 'DISPUTE' });
    }

    return NextResponse.json({ error: 'Resolution không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý khiếu nại' }, { status: 500 });
  }
}
