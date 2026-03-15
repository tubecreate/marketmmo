import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get userId from query param to simplify for this demo 
    // (In production we'd use session/auth)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ role: 'NONE' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        buyerId: true,
        sellerId: true
      }
    });

    if (!order) {
      return NextResponse.json({ role: 'NONE' });
    }

    if (order.sellerId === userId) {
      return NextResponse.json({ role: 'SELLER' });
    }

    if (order.buyerId === userId) {
      return NextResponse.json({ role: 'BUYER' });
    }

    return NextResponse.json({ role: 'NONE' });
  } catch (error) {
    console.error('Check order role error:', error);
    return NextResponse.json({ role: 'NONE' }, { status: 500 });
  }
}
