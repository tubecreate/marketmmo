import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, balance: true, holdBalance: true }});
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  return NextResponse.json({ users, orders });
}
