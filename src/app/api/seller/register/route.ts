import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, fullName, phone, facebook, cccd, bankName, bankAccount, telegram } = data;

    if (!userId || !fullName || !phone || !bankName || !bankAccount) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Check if there is already a PENDING or APPROVED request
    const existing = await prisma.sellerRequest.findUnique({
      where: { userId }
    });

    if (existing && (existing.status === 'PENDING' || existing.status === 'APPROVED')) {
      return NextResponse.json({ error: 'Bạn đã gửi yêu cầu hoặc đã là người bán' }, { status: 400 });
    }

    if (existing && existing.status === 'REJECTED') {
      // Allow re-submission by updating existing record
      const updated = await prisma.sellerRequest.update({
        where: { userId },
        data: {
          fullName, phone, facebook, cccd, bankName, bankAccount, telegram,
          status: 'PENDING',
          updatedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, request: updated });
    }

    const request = await prisma.sellerRequest.create({
      data: {
        userId, fullName, phone, facebook, cccd, bankName, bankAccount, telegram,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('Seller register error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
