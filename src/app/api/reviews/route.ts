import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/reviews
// Filter by sellerId, productId, rating
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    const productId = searchParams.get('productId');
    const rating = searchParams.get('rating');
    const sort = searchParams.get('sort') || 'newest';

    const where: any = {};
    if (productId) where.productId = productId;
    if (rating) where.rating = parseInt(rating);
    if (sellerId) {
      where.product = {
        sellerId: sellerId
      };
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          select: { title: true, slug: true }
        },
        order: {
          include: {
            buyer: {
              select: { username: true, avatar: true }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' }
    });

    return NextResponse.json(reviews);
  } catch (err) {
    console.error('Fetch reviews error:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, productId, rating, comment } = body;

    if (!orderId || !productId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Order not found or not completed' }, { status: 400 });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { orderId }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Order already reviewed' }, { status: 400 });
    }

    const review = await prisma.$transaction(async (tx: any) => {
      const rev = await tx.review.create({
        data: {
          orderId,
          productId,
          rating,
          comment
        }
      });

      // Update product rating
      const allReviews = await tx.review.findMany({
        where: { productId },
        select: { rating: true }
      });

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await tx.product.update({
        where: { id: productId },
        data: { rating: avgRating }
      });

      return rev;
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
