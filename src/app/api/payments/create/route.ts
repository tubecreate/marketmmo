import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();

    if (!userId || !amount || amount < 10000) {
      return NextResponse.json({ error: 'Số tiền nạp tối thiểu là 10.000đ' }, { status: 400 });
    }

    // 1. Fetch system config for bank info (we might need to add bank info to system config too)
    // For now, let's assume some default or fetch from SystemConfig if we added it there.
    // User shared developer.sepay.vn docs which usually implies we use their gateway or instructions.
    
    const config = await prisma.systemConfig.findUnique({ where: { id: 'default' } });
    
    // 2. Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        description: 'Nạp tiền qua SePay',
      }
    });

    // 3. Generate a unique payment code: MKT + Transaction ID (shortened)
    const paymentCode = `MKT${transaction.id.slice(-6).toUpperCase()}`;
    
    // Update the transaction with the actual payment code in description
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { description: paymentCode }
    });

    // 4. Return instructions
    // Note: In a real app, bank account info should come from SystemConfig
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentCode,
      amount: parseFloat(amount),
      bankInfo: {
        bankName: 'MB Bank', // Example, should be configurable
        accountNumber: '123456789', // Example
        accountHolder: 'NGUYEN VAN A', // Example
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Lỗi tạo yêu cầu thanh toán' }, { status: 500 });
  }
}
