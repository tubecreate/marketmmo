import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

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
        seller: { select: { id: true, username: true, fullName: true, avatar: true, isActive: true, createdAt: true, insuranceBalance: true, _count: { select: { sellerOrders: true } } } },
        _count: {
          select: {
            items: { where: { isSold: false } },
            orders: { where: { review: { isNot: null } } }
          }
        },
        variants: true
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

    // Check if requester is ADMIN
    const isAdmin = data.role === 'ADMIN';
    
    // For normal sellers, only allow changing to 'ACTIVE' or 'CLOSED' 
    // AND only if the current status isn't PENDING/REJECTED (or allow them to close pending?)
    // Let's keep it simple: if not admin, we only allow certain status transitions.
    
    let nextStatus = data.status;
    if (!isAdmin) {
      if (data.status === 'CLOSED' || data.status === 'ACTIVE') {
        nextStatus = data.status;
      } else {
        delete data.status;
        nextStatus = undefined;
      }
    }

    let updateData: any = {
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price ? parseFloat(data.price) : undefined,
      priceMax: data.priceMax ? parseFloat(data.priceMax) : undefined,
      status: nextStatus,
      categoryId: data.categoryId,
      thumbnail: data.thumbnail,
    };

    if (data.isService !== undefined) updateData.isService = !!data.isService;
    if (data.allowBidding !== undefined) updateData.allowBidding = !!data.allowBidding;
    if (data.deliveryTimeHours !== undefined) updateData.deliveryTimeHours = data.deliveryTimeHours ? parseInt(data.deliveryTimeHours) : null;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });

    if (data.status === 'ACTIVE' && isAdmin) {
      await sendSystemMessage(updated.sellerId, `✅ Tuyệt vời! Gian hàng "${updated.title}" của bạn đã được duyệt và đang hiển thị trên sàn.`);
    } else if (data.status === 'REJECTED' && isAdmin) {
      await sendSystemMessage(updated.sellerId, `❌ Rất tiếc, gian hàng "${updated.title}" của bạn đã bị từ chối duyệt. Vui lòng kiểm tra lại thông tin.`);
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    // We now soft-close instead of physical deletion as per user request
    await prisma.product.update({ 
      where: { id }, 
      data: { status: 'CLOSED' } 
    });
    return NextResponse.json({ success: true, message: 'Booth closed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Close failed' }, { status: 500 });
  }
}
