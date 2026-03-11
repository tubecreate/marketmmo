import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import slugify from 'slugify';

interface VariantInput { id: string; name: string; price: string; description?: string; }

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, description, categoryId, type, sellerId, warrantyDays, variants, stockMap } = data;

    if (!title || !type || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields: title, type, sellerId' }, { status: 400 });
    }

    const slug = `${slugify(title, { lower: true, locale: 'vi', strict: true })}-${Math.random().toString(36).substring(2, 7)}`;

    // Use the lowest variant price as base price (for display on product cards)
    const variantList: VariantInput[] = variants || [];
    const basePrice = variantList.length > 0
      ? Math.min(...variantList.map(v => parseFloat(v.price) || 0))
      : parseFloat(data.price || '0');
    const maxPrice = variantList.length > 1
      ? Math.max(...variantList.map(v => parseFloat(v.price) || 0))
      : null;

    // 1. Create the product
    const product = await prisma.product.create({
      data: {
        title,
        description: description || '',
        slug,
        categoryId: categoryId || null,
        price: basePrice,
        priceMax: maxPrice,
        type,
        sellerId,
        warrantyDays: warrantyDays ? parseInt(warrantyDays) : 3,
        status: 'ACTIVE',
      },
    });

    // 2. Create variants (if any)
    const createdVariants: { tempId: string; dbId: string }[] = [];
    for (let i = 0; i < variantList.length; i++) {
      const v = variantList[i];
      if (!v.name?.trim() || !v.price) continue;
      const dbVariant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: v.name.trim(),
          price: parseFloat(v.price),
          description: v.description?.trim() || null,
          sortOrder: i,
        },
      });
      createdVariants.push({ tempId: v.id, dbId: dbVariant.id });
    }

    // 3. Upload stock items per variant (from stockMap: { [tempVariantId]: "line1\nline2" })
    if (stockMap && typeof stockMap === 'object') {
      for (const [tempId, rawContent] of Object.entries(stockMap)) {
        if (!rawContent || typeof rawContent !== 'string') continue;
        const lines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        // Find the matching DB variant ID
        const match = createdVariants.find(cv => cv.tempId === tempId);
        const variantId = match?.dbId || null;

        await prisma.productItem.createMany({
          data: lines.map(line => ({
            productId: product.id,
            variantId,
            content: line,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg || 'Failed to create product' }, { status: 500 });
  }
}
