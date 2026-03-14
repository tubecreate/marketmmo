import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/orders/[id]/confirm
// Body: { buyerId }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { buyerId } = await req.json();
    const { id: orderId } = await params;

    if (!buyerId) {
      return NextResponse.json({ error: 'Missing buyerId' }, { status: 400 });
    }

    // 1. Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true, amount: true, fee: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    if (order.buyerId !== buyerId) {
      return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
    }

    if (order.status !== 'HOLDING' && order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Đơn hàng không ở trạng thái có thể xác nhận' }, { status: 400 });
    }

    const sellerReceives = order.amount - order.fee;

    // 2. Execute transaction to release escrow
    await prisma.$transaction([
      // Update order status
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      }),
      // Transfer funds from seller's holdBalance to main balance
      prisma.user.update({
        where: { id: order.sellerId },
        data: {
          holdBalance: { decrement: sellerReceives },
          balance: { increment: sellerReceives },
          totalRevenue: { increment: sellerReceives }, // Recognize revenue upon completion
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Xác nhận đơn hàng thành công' });
  } catch (error) {
    console.error('Order confirm error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg || 'Lỗi xử lý xác nhận đơn hàng' }, { status: 500 });
  }
}
