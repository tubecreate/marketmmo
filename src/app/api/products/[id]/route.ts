import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, username: true, fullName: true, avatar: true, isActive: true, createdAt: true, _count: { select: { sellerOrders: true } } } },
        _count: {
          select: {
            items: { where: { isSold: false } }
          }
        }
      },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const data = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price ? parseFloat(data.price) : undefined,
        priceMax: data.priceMax ? parseFloat(data.priceMax) : undefined,
        status: data.status,
        categoryId: data.categoryId,
        thumbnail: data.thumbnail,
      }
    });

    return NextResponse.json({ success: true, product: updated });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const orderCount = await prisma.order.count({ where: { productId: id } });
    if (orderCount > 0) {
      await prisma.product.update({ where: { id }, data: { status: 'DELETED' } });
      return NextResponse.json({ success: true, message: 'Status set to deleted due to existing orders' });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
