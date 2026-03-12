import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { contents } = await req.json();

    if (!Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json({ success: true, duplicates: [] });
    }

    // Check ProductItem (current stock)
    const existingItems = await prisma.productItem.findMany({
      where: {
        content: { in: contents },
      },
      select: { content: true },
    });

    // Check Order (previously sold content)
    // Note: deliveredContent might contain multiple accounts separated by newlines
    // For exact match across the platform, we need to be careful.
    // However, if the user uploads a list of accounts, we check if any exact account exist in orders.
    // deliveredContent in Order is often the same string format.
    
    // To handle potential multiple items in one deliveredContent, we use contains if needed,
    // but for strict platform-wide uniqueness, we check if the content has ever been sold.
    const soldOrders = await prisma.order.findMany({
      where: {
        OR: contents.map(content => ({
          deliveredContent: { contains: content }
        }))
      },
      select: { deliveredContent: true }
    });

    const duplicates = new Set<string>();
    
    existingItems.forEach((item: { content: string }) => duplicates.add(item.content));
    
    // For orders, since it's a "contains" check, we verify which specific content matches
    soldOrders.forEach((order: { deliveredContent: string | null }) => {
      if (order.deliveredContent) {
        contents.forEach((content: string) => {
          if (order.deliveredContent?.includes(content)) {
            duplicates.add(content);
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      duplicates: Array.from(duplicates) 
    });
  } catch (error) {
    console.error('Check duplicates error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi kiểm tra trùng lặp' }, { status: 500 });
  }
}
