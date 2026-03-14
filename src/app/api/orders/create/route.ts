import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

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
      prisma.product.findUnique({ where: { id: productId }, select: { id: true, sellerId: true, status: true, soldCount: true, warrantyDays: true, isService: true, allowBidding: true } }),
      variantId ? prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true, price: true, name: true } }) : Promise.resolve(null),
    ]);

    if (!buyer || !buyer.isActive) return NextResponse.json({ error: 'Tài khoản không hợp lệ' }, { status: 403 });
    if (!product || product.status !== 'ACTIVE') return NextResponse.json({ error: 'Gian hàng không khả dụng' }, { status: 400 });
    if (buyer.id === product.sellerId) return NextResponse.json({ error: 'Không thể mua hàng từ gian hàng của chính mình' }, { status: 400 });

    // Check if it's a SERVICE item
    if (product.isService) {
      if (product.allowBidding) {
        // ── SERVICE BIDDING FLOW ──
        // No upfront charge. Order goes to NEGOTIATING.
        const order = await prisma.order.create({
          data: {
            buyerId,
            sellerId: product.sellerId,
            productId,
            amount: 0, 
            customPrice: null, // To be bidded by seller
            quantity: 1, // Services usually 1 unit
            fee: 0,
            status: 'NEGOTIATING',
            deliveredContent: null,
            variantName: variant?.name || 'Sản phẩm dịch vụ',
            variantId: variantId || null,
          } as any,
        });

        // Notify Seller
        await sendSystemMessage(
          product.sellerId,
          `💬 Có khách yêu cầu dịch vụ "${variant?.name || 'Kho chung'}"! \nMã đơn: #${order.id.slice(-8).toUpperCase()}\nVui lòng vào chi tiết đơn để BÁO GIÁ cho khách hàng.`
        );
        // Notify Buyer
        await sendSystemMessage(
          buyerId,
          `📝 Tạo đơn yêu cầu thành công!\nMã đơn: #${order.id.slice(-8).toUpperCase()}\nVui lòng chờ người bán phản hồi báo giá.`
        );

        return NextResponse.json({
          success: true,
          order: {
            id: order.id,
            amount: 0,
            quantity: 1,
            status: 'NEGOTIATING',
            variantName: variant?.name || 'Sản phẩm dịch vụ',
          },
        });
      } else {
        // ── SERVICE FIXED PRICE FLOW ──
        const unitPrice = variant ? variant.price : (
          await prisma.productVariant.findFirst({ where: { productId }, orderBy: { price: 'asc' } })
        )?.price ?? 0;
        
        const totalAmount = unitPrice * quantity;
        const platformFee = Math.floor(totalAmount * 0.05);
        const sellerReceives = totalAmount - platformFee;

        if (buyer.balance < totalAmount) {
          return NextResponse.json({
            error: `Số dư không đủ. Cần ${totalAmount.toLocaleString('vi-VN')}đ, còn ${buyer.balance.toLocaleString('vi-VN')}đ.`
          }, { status: 400 });
        }

        const [order] = await prisma.$transaction([
          prisma.order.create({
            data: {
              buyerId,
              sellerId: product.sellerId,
              productId,
              amount: totalAmount,
              quantity,
              fee: platformFee,
              status: 'PENDING_ACCEPTANCE', // Wait for seller to accept
              deliveredContent: null,
              variantName: variant?.name || 'Sản phẩm dịch vụ',
              variantId: variantId || null,
            } as any,
          }),
          prisma.user.update({
            where: { id: buyerId },
            data: { balance: { decrement: totalAmount } },
          }),
          prisma.user.update({
            where: { id: product.sellerId },
            data: { holdBalance: { increment: sellerReceives } },
          }),
        ]);

        await sendSystemMessage(
          product.sellerId,
          `💼 Có đơn đặt hàng dịch vụ mới!\nMã đơn: #${order.id.slice(-8).toUpperCase()}\nKhách đã thanh toán: ${totalAmount.toLocaleString('vi-VN')}đ (Đang tạm giữ).\nVui lòng vào chi tiết đơn và ấn BẮT ĐẦU LÀM.`
        );

        return NextResponse.json({
          success: true,
          order: {
            id: order.id,
            amount: totalAmount,
            quantity,
            status: 'PENDING_ACCEPTANCE',
            variantName: variant?.name || 'Sản phẩm dịch vụ',
          },
        });
      }
    }

    // 2. Lock available stock items (FIFO) for the selected variant (DIGITAL ONLY)
    const availableItems = await prisma.productItem.findMany({
      where: {
        productId,
        variantId: variantId || null,
        isSold: false,
      },
      orderBy: { createdAt: 'asc' },
      take: quantity,
    });

    const isPreOrder = availableItems.length < quantity;

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

    if (isPreOrder) {
      // ── PRE-ORDER FLOW ──
      const [order] = await prisma.$transaction([
        prisma.order.create({
          data: {
            buyerId,
            sellerId: product.sellerId,
            productId,
            amount: totalAmount,
            quantity,
            fee: platformFee,
            status: 'PRE_ORDER',
            deliveredContent: null,
            variantName: variant?.name || 'Kho chung',
            variantId: variantId || null,
          } as any,
        }),
        // Deduct from buyer's balance
        prisma.user.update({
          where: { id: buyerId },
          data: { balance: { decrement: totalAmount } },
        }),
        // Add to seller's holdBalance (escrow)
        prisma.user.update({
          where: { id: product.sellerId },
          data: { holdBalance: { increment: sellerReceives } },
        }),
        // Update product activity timestamp
        prisma.product.update({
          where: { id: productId },
          data: { lastSoldAt: new Date() },
        }),
      ]);

      // Send notifications
      try {
        await sendSystemMessage(
          product.sellerId,
          `📦 Đơn đặt trước mới!\nMã đơn: #${order.id.slice(-8).toUpperCase()}\nSố lượng: ${quantity}\nThu nhập dự kiến: +${sellerReceives.toLocaleString('vi-VN')}đ (Đang tạm giữ)\nVui lòng nhập thêm hàng để tự động giao cho người mua.`
        );
        await sendSystemMessage(
          buyerId,
          `⏳ Bạn đã đặt trước thành công!\nMã đơn: #${order.id.slice(-8).toUpperCase()}\nSố lượng: ${quantity}\nSố tiền: -${totalAmount.toLocaleString('vi-VN')}đ\nHàng sẽ được giao tự động khi người bán nhập kho. Bạn có thể huỷ bất kỳ lúc nào.`
        );
      } catch (e) {
        console.error('Failed to notify users via chat', e);
      }

      return NextResponse.json({
        success: true,
        preOrder: true,
        order: {
          id: order.id,
          amount: totalAmount,
          quantity,
          variantName: variant?.name || 'Kho chung',
          deliveredContent: null,
        },
      });
    }

    // ── NORMAL ORDER FLOW ──
    // 5. Execute transaction atomically
    const itemIds = availableItems.map((i: { id: string }) => i.id);
    const deliveredContent = availableItems.map((i: { content: string }) => i.content).join('\n');
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
          quantity,
          fee: platformFee,
          status: 'HOLDING', // Temporary hold status
          deliveredContent,
          warrantyExpire,
          variantName: variant?.name || 'Kho chung',
          variantId: variantId || null,
        } as any,
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
      // Add to seller's holdBalance (escrow)
      prisma.user.update({
        where: { id: product.sellerId },
        data: {
          holdBalance: { increment: sellerReceives },
        },
      }),
      // Increment product soldCount and update activity timestamp
      prisma.product.update({
        where: { id: productId },
        data: { 
          soldCount: { increment: quantity },
          lastSoldAt: new Date()
        },
      }),
    ]);

    // Send system notifications
    try {
      await sendSystemMessage(
        product.sellerId,
        `🎉 Bạn có 1 đơn hàng mới!\nMã đơn: #${order.id.slice(-8).toUpperCase()}\nSố lượng: ${quantity}\nThu nhập dự kiến: +${sellerReceives.toLocaleString('vi-VN')}đ (Đang tạm giữ)`
      );
      await sendSystemMessage(
        buyerId,
        `✅ Bạn đã mua hàng thành công!\nMã đơn: #${order.id.slice(-8).toUpperCase()}\nSố lượng: ${quantity}\nSố tiền: -${totalAmount.toLocaleString('vi-VN')}đ\nVui lòng kiểm tra chi tiết trong trang Quản lý đơn hàng.`
      );
    } catch (e) {
      console.error('Failed to notify users via chat', e);
    }

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
