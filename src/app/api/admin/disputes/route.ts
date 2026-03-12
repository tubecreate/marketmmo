import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const disputes = await prisma.dispute.findMany({
      where: { status: 'ESCALATED' },
      include: {
        order: {
          include: {
            product: { select: { title: true } },
            buyer: { select: { username: true } },
            seller: { select: { username: true } },
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
    
    return NextResponse.json({ disputes });
  } catch (error: any) {
    console.error('Fetch admin disputes error:', error);
    return NextResponse.json({ error: 'Lỗi lấy danh sách tranh chấp' }, { status: 500 });
  }
}
