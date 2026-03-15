import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            title: true,
            thumbnail: true,
            isService: true,
            description: true,
          }
        },
        buyer: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        },
        variant: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
