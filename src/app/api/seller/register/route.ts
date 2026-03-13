import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Seller registration data received:', data);
    const models = Object.keys(prisma).filter(k => !k.startsWith('_'));
    console.log('Available models check:', {
      total: models.length,
      hasSellerRequest: !!(prisma as any).sellerRequest,
      modelList: models
    });
    const { userId, fullName, phone, facebook, cccd, bankName, bankAccount, telegram } = data;

    if (!userId || !fullName || !phone || !bankName || !bankAccount) {
      console.log('Missing mandatory fields:', { userId: !!userId, fullName: !!fullName, phone: !!phone, bankName: !!bankName, bankAccount: !!bankAccount });
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
  } catch (error: any) {
    console.error('Seller register error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Lỗi hệ thống', 
      debug: error.message 
    }, { status: 500 });
  }
}
