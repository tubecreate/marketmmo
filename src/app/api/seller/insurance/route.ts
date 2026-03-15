import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/seller/insurance?userId=xxx
// Returns insurance balance and recent insurance transactions
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { insuranceBalance: true, balance: true, holdBalance: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { 
        userId,
        type: { in: ['INSURANCE_DEPOSIT', 'INSURANCE_WITHDRAW'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      insuranceBalance: user.insuranceBalance,
      balance: user.balance,
      holdBalance: user.holdBalance,
      transactions
    });
  } catch (error) {
    console.error('Fetch insurance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/seller/insurance
// Body: { userId, action: 'DEPOSIT' | 'WITHDRAW', amount, source: 'MAIN' | 'SHOP' }
export async function POST(req: Request) {
  try {
    const { userId, action, amount, source } = await req.json();

    if (!userId || !action || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true, holdBalance: true, insuranceBalance: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'DEPOSIT') {
      const sourceBalance = source === 'SHOP' ? user.holdBalance : user.balance;
      
      if (sourceBalance < amount) {
        return NextResponse.json({ error: 'Không đủ số dư' }, { status: 400 });
      }

      await prisma.$transaction([
        // Update user balances
        prisma.user.update({
          where: { id: userId },
          data: {
            [source === 'SHOP' ? 'holdBalance' : 'balance']: { decrement: amount },
            insuranceBalance: { increment: amount }
          }
        }),
        // Create transaction log
        prisma.transaction.create({
          data: {
            userId,
            amount,
            type: 'INSURANCE_DEPOSIT',
            status: 'SUCCESS',
            description: `Nạp quỹ bảo hiểm từ ví ${source === 'SHOP' ? 'SHOP' : 'CHÍNH'}`
          }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Nạp quỹ bảo hiểm thành công' });

    } else if (action === 'WITHDRAW') {
      if (user.insuranceBalance < amount) {
        return NextResponse.json({ error: 'Số dư quỹ bảo hiểm không đủ' }, { status: 400 });
      }

      // Check for pending orders
      const pendingOrders = await prisma.order.count({
        where: {
          sellerId: userId,
          status: { in: ['PENDING', 'HOLDING', 'DELIVERED', 'PRE_ORDER'] }
        }
      });

      if (pendingOrders > 0) {
        return NextResponse.json({ 
          error: 'Bạn còn đơn hàng đang chờ xử lý. Không thể rút quỹ bảo hiểm lúc này.' 
        }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            insuranceBalance: { decrement: amount },
            balance: { increment: amount }
          }
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount,
            type: 'INSURANCE_WITHDRAW',
            status: 'SUCCESS',
            description: 'Rút quỹ bảo hiểm về ví CHÍNH'
          }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Rút quỹ bảo hiểm thành công' });
    }

    return NextResponse.json({ error: 'Action invalid' }, { status: 400 });

  } catch (error) {
    console.error('Insurance transaction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
