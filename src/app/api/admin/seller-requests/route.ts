import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// GET /api/admin/seller-requests - Get list of pending requests
export async function GET() {
  try {
    const requests = await prisma.sellerRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy dữ liệu' }, { status: 500 });
  }
}

// PATCH /api/admin/seller-requests - Approve/Reject a request
export async function PATCH(req: Request) {
  try {
    const { requestId, status, adminNote } = await req.json();

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const sellerRequest = await prisma.sellerRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!sellerRequest) {
        return NextResponse.json({ error: 'Không tìm thấy yêu cầu' }, { status: 404 });
    }

    const updatedRequest = await prisma.sellerRequest.update({
      where: { id: requestId },
      data: { status, adminNote, updatedAt: new Date() }
    });

    if (status === 'APPROVED') {
      // Update User role and details
      await prisma.user.update({
        where: { id: sellerRequest.userId },
        data: {
          role: 'SELLER',
          fullName: sellerRequest.fullName,
          phone: sellerRequest.phone,
          bankName: sellerRequest.bankName,
          bankAccount: sellerRequest.bankAccount,
        }
      });

      await sendSystemMessage(sellerRequest.userId, `🎉 Chúc mừng! Hồ sơ đăng ký bán hàng của bạn đã được duyệt. Hiện tại bạn đã có thể bắt đầu tạo gian hàng.`);
    } else if (status === 'REJECTED') {
      await sendSystemMessage(sellerRequest.userId, `❌ Yêu cầu đăng ký bán hàng của bạn đã bị từ chối.${adminNote ? ` Lý do: ${adminNote}` : ''}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update seller request error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý hệ thống' }, { status: 500 });
  }
}
