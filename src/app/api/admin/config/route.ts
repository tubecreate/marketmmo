import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 'default' }
    });
    
    if (!config) {
      const newConfig = await prisma.systemConfig.create({
        data: {
          id: 'default',
          maxBoothsPerSeller: 10,
          maxItemsPerOrder: 50,
          commissionRate: 5,
          minWithdrawAmount: 50000,
          maintenanceMode: false,
        }
      });
      return NextResponse.json({ config: newConfig });
    }

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('Fetch system config error:', error);
    return NextResponse.json({ error: 'Lỗi lấy cấu hình hệ thống' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();

    const config = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      update: {
        maxBoothsPerSeller: data.maxBoothsPerSeller,
        maxItemsPerOrder: data.maxItemsPerOrder,
        commissionRate: data.commissionRate,
        minWithdrawAmount: data.minWithdrawAmount,
        maintenanceMode: data.maintenanceMode,
        sepayApiKey: data.sepayApiKey,
        sepayMerchantId: data.sepayMerchantId,
        sepayWebhookSecret: data.sepayWebhookSecret,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankOwner: data.bankOwner,
      } as any, // Cast to any because Prisma types might be stale
      create: {
        id: 'default',
        maxBoothsPerSeller: data.maxBoothsPerSeller ?? 10,
        maxItemsPerOrder: data.maxItemsPerOrder ?? 50,
        commissionRate: data.commissionRate ?? 5,
        minWithdrawAmount: data.minWithdrawAmount ?? 50000,
        maintenanceMode: data.maintenanceMode ?? false,
        sepayApiKey: data.sepayApiKey,
        sepayMerchantId: data.sepayMerchantId,
        sepayWebhookSecret: data.sepayWebhookSecret,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankOwner: data.bankOwner,
      } as any
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('Update system config error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật cấu hình hệ thống' }, { status: 500 });
  }
}
