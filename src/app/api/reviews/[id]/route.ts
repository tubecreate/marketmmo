import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/reviews/[id]
// Seller reply to a review
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { sellerReply, userId } = body;

    if (!sellerReply || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify review existence and seller permission
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.product.sellerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        sellerReply,
        sellerReplyAt: new Date()
      } as any
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (err) {
    console.error('Reply review error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
