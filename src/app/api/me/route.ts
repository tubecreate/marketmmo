import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/me?userId=xxx - Get current user info
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true, fullName: true, balance: true,
      holdBalance: true, // <-- Added this
      role: true, level: true, totalRevenue: true, isActive: true, avatar: true,
      telegramId: true, twoFactorEnabled: true, phone: true,
      createdAt: true,
      _count: { select: { buyerOrders: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(user);
}
