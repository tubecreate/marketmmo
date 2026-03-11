import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/orders/create
// Body: { buyerId, productId, variantId?, quantity }
export async function POST(req: Request) {
  try {
    const { buyerId, productId, variantId, quantity = 1 } = await req.json();

    if (!buyerId || !productId) {
      return NextResponse.json({ error: 'Missing buyerId or productId' }, { status: 400 });
    }
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // 1. Fetch buyer and product in parallel
    const [buyer, product, variant] = await Promise.all([
      prisma.user.findUnique({ where: { id: buyerId }, select: { id: true, balance: true, isActive: true } }),
      prisma.product.findUnique({ where: { id: productId }, select: { id: true, sellerId: true, status: true, soldCount: true, warrantyDays: true } }),
      variantId ? prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true, price: true, name: true } }) : Promise.resolve(null),
    ]);

    if (!buyer || !buyer.isActive) return NextResponse.json({ error: 'Tài khoản không hợp lệ' }, { status: 403 });
    if (!product || product.status !== 'ACTIVE') return NextResponse.json({ error: 'Sản phẩm không khả dụng' }, { status: 400 });
    if (buyer.id === product.sellerId) return NextResponse.json({ error: 'Không thể mua sản phẩm của chính mình' }, { status: 400 });

    // 2. Lock available stock items (FIFO) for the selected variant
    const availableItems = await prisma.productItem.findMany({
      where: {
        productId,
        variantId: variantId || null,
        isSold: false,
      },
      orderBy: { createdAt: 'asc' },
      take: quantity,
    });

    if (availableItems.length < quantity) {
      return NextResponse.json({
        error: `Không đủ hàng. Chỉ còn ${availableItems.length} sản phẩm.`
      }, { status: 400 });
    }

    // 3. Calculate price
    const unitPrice = variant ? variant.price : (
      await prisma.productVariant.findFirst({ where: { productId }, orderBy: { price: 'asc' } })
    )?.price ?? 0;

    const totalAmount = unitPrice * quantity;
    const platformFee = Math.floor(totalAmount * 0.05); // 5% platform fee
    const sellerReceives = totalAmount - platformFee;

    // 4. Check buyer balance
    if (buyer.balance < totalAmount) {
      return NextResponse.json({
        error: `Số dư không đủ. Cần ${totalAmount.toLocaleString('vi-VN')}đ, còn ${buyer.balance.toLocaleString('vi-VN')}đ.`
      }, { status: 400 });
    }

    // 5. Execute transaction atomically
    const itemIds = availableItems.map(i => i.id);
    const deliveredContent = availableItems.map(i => i.content).join('\n');
    const warrantyExpire = new Date();
    warrantyExpire.setDate(warrantyExpire.getDate() + (product.warrantyDays || 3));

    const [order] = await prisma.$transaction([
      // Create order
      prisma.order.create({
        data: {
          buyerId,
          sellerId: product.sellerId,
          productId,
          amount: totalAmount,
          fee: platformFee,
          status: 'COMPLETED',
          deliveredContent,
          warrantyExpire,
        },
      }),
      // Mark items as sold
      prisma.productItem.updateMany({
        where: { id: { in: itemIds } },
        data: { isSold: true, soldAt: new Date() },
      }),
      // Deduct from buyer's balance
      prisma.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: totalAmount } },
      }),
      // Add to seller's balance and revenue
      prisma.user.update({
        where: { id: product.sellerId },
        data: {
          balance: { increment: sellerReceives },
          totalRevenue: { increment: sellerReceives },
        },
      }),
      // Increment product soldCount
      prisma.product.update({
        where: { id: productId },
        data: { soldCount: { increment: quantity } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: totalAmount,
        quantity,
        variantName: variant?.name || 'Kho chung',
        deliveredContent,
        warrantyExpire,
      },
    });

  } catch (error) {
    console.error('Order create error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg || 'Có lỗi xảy ra khi xử lý đơn hàng' }, { status: 500 });
  }
}
