import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import slugify from 'slugify';

interface VariantInput { id: string; name: string; price: string; description?: string; }

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, description, categoryId, type, sellerId, warrantyDays, variants } = data;

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
        shortDescription: data.shortDescription || null,
        description: description || '',
        slug,
        categoryId: categoryId || null,
        thumbnail: data.thumbnail || null,
        price: basePrice,
        priceMax: maxPrice,
        type,
        sellerId,
        warrantyDays: warrantyDays ? parseInt(warrantyDays) : 3,
        status: 'PENDING',
      },
    });

    // 2. Create variants (if any)
    for (let i = 0; i < variantList.length; i++) {
      const v = variantList[i];
      if (!v.name?.trim() || !v.price) continue;
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: v.name.trim(),
          price: parseFloat(v.price),
          description: v.description?.trim() || null,
          sortOrder: i,
        },
      });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg || 'Failed to create product' }, { status: 500 });
  }
}
