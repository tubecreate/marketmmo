import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

// GET /api/products/[id]/stock?isSold=false&variantId=xxx
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const isSoldParam = searchParams.get('isSold');
  const variantId = searchParams.get('variantId'); // optional filter

  const where: Record<string, unknown> = { productId: id };
  if (isSoldParam !== null) where.isSold = isSoldParam === 'true';
  if (variantId) where.variantId = variantId;

  try {
    const items = await prisma.productItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/products/[id]/stock  { contentLines: string[], variantId?: string }
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const { contentLines, variantId } = await req.json();

    if (!contentLines || !Array.isArray(contentLines)) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const lines = contentLines.filter((l: string) => typeof l === 'string' && l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'No valid lines' }, { status: 400 });
    }

    // Validate variant belongs to this product if provided
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId: id } });
      if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    await prisma.productItem.createMany({
      data: lines.map((line: string) => ({
        productId: id,
        variantId: variantId || null,
        content: line.trim(),
      })),
    });

    // ── AUTO-FULFILL PRE-ORDERS ──
    let fulfilledCount = 0;
    try {
      // Find the seller first for notification
      const productInfo = await prisma.product.findUnique({
        where: { id },
        select: { sellerId: true, warrantyDays: true }
      });

      if (productInfo) {
        // Find pending pre-orders for this product + variant (FIFO)
        const preOrders = await prisma.order.findMany({
          where: {
            productId: id,
            status: 'PRE_ORDER',
            variantId: variantId || null,
          } as any,
          orderBy: { createdAt: 'asc' },
        });

        for (const preOrder of preOrders) {
          // Get available items for this order
          const availableItems = await prisma.productItem.findMany({
            where: {
              productId: id,
              variantId: variantId || null,
              isSold: false,
            } as any,
            orderBy: { createdAt: 'asc' },
            take: preOrder.quantity,
          });

          if (availableItems.length < preOrder.quantity) {
            // Not enough stock for this pre-order, skip (wait for more stock)
            break;
          }

          // Fulfill this pre-order
          const itemIds = availableItems.map((i: { id: string }) => i.id);
          const deliveredContent = availableItems.map((i: { content: string }) => i.content).join('\n');
          
          const warrantyExpire = new Date();
          warrantyExpire.setDate(warrantyExpire.getDate() + (productInfo.warrantyDays || 3));

          await prisma.$transaction([
            // Update order
            prisma.order.update({
              where: { id: preOrder.id },
              data: {
                status: 'HOLDING',
                deliveredContent,
                warrantyExpire,
              },
            }),
            // Mark items as sold
            prisma.productItem.updateMany({
              where: { id: { in: itemIds } },
              data: { isSold: true, soldAt: new Date() },
            }),
            // Increment product soldCount and update activity timestamp
            prisma.product.update({
              where: { id },
              data: { 
                soldCount: { increment: preOrder.quantity },
                lastSoldAt: new Date()
              },
            }),
          ]);

          fulfilledCount++;

          // Notify buyer
          try {
            await sendSystemMessage(
              preOrder.buyerId,
              `🎉 Đơn đặt trước #${preOrder.id.slice(-8).toUpperCase()} đã được giao!\nSố lượng: ${preOrder.quantity}\nVui lòng kiểm tra nội dung trong mục Quản lý đơn hàng.`
            );
          } catch (e) {
            console.error('Failed to notify buyer about pre-order fulfillment', e);
          }
        }

        // Notify seller about summary
        if (fulfilledCount > 0) {
          try {
            await sendSystemMessage(
              productInfo.sellerId,
              `✅ Công cụ nạp kho đã tự động giao ${fulfilledCount} đơn hàng đặt trước cho sản phẩm này.`
            );
          } catch (e) {
            console.error('Failed to notify seller about pre-order summary', e);
          }
        }
      }
    } catch (e) {
      console.error('Pre-order auto-fulfillment error:', e);
    }

    return NextResponse.json({ success: true, count: lines.length, fulfilledPreOrders: fulfilledCount });
  } catch {
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 });
  }
}


// DELETE /api/products/[id]/stock?itemId=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
  try {
    const item = await prisma.productItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (item.isSold) return NextResponse.json({ error: 'Cannot delete sold items' }, { status: 400 });
    await prisma.productItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
