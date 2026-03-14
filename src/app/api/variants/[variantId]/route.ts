import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, context: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await context.params;
  try {
    const data = await req.json();
    const { name, price, allowBidding, deliveryTimeHours, description } = data;

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        allowBidding: allowBidding !== undefined ? !!allowBidding : undefined,
        deliveryTimeHours: deliveryTimeHours !== undefined ? (deliveryTimeHours ? parseInt(deliveryTimeHours) : null) : undefined,
        description,
      } as any
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await context.params;
  try {
    // Check if variant has items or orders
    const itemCount = await prisma.productItem.count({ where: { variantId } });
    if (itemCount > 0) {
      return NextResponse.json({ error: 'Cannot delete variant with existing stock' }, { status: 400 });
    }

    await prisma.productVariant.delete({ where: { id: variantId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
