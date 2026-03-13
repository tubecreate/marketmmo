import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentCode = searchParams.get('paymentCode');

  if (!paymentCode) {
    return NextResponse.json({ error: 'Missing paymentCode' }, { status: 400 });
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        description: paymentCode,
        type: 'DEPOSIT'
      },
      select: {
        status: true,
        amount: true,
        userId: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: transaction.status,
      amount: transaction.amount,
      userId: transaction.userId
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
