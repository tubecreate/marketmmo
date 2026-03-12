import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfDay, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Basic Stats
    const totalOrders = await prisma.order.count({ where: { sellerId: userId } });
    const totalProducts = await prisma.product.count({ where: { sellerId: userId } });
    const activeProducts = await prisma.product.count({ where: { sellerId: userId, status: 'ACTIVE' } });
    
    const revenueData = await prisma.order.aggregate({
      where: { 
        sellerId: userId, 
        status: { in: ['COMPLETED', 'HOLDING'] } 
      },
      _sum: { amount: true }
    });

    const openDisputes = await prisma.dispute.count({
      where: { 
        order: { sellerId: userId },
        status: 'OPEN'
      }
    });

    // 2. Inventory Stats (Tồn kho)
    // Products with their unsold items count
    const productsWithItems = await prisma.product.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        _count: {
          select: { items: { where: { isSold: false } } }
        }
      }
    });
    const totalStock = productsWithItems.reduce((acc, p) => acc + p._count.items, 0);

    // 3. Growth Data (Last 30 days)
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const ordersGrowth = await prisma.order.findMany({
      where: {
        sellerId: userId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['COMPLETED', 'HOLDING'] }
      },
      select: {
        amount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day for the chart
    const dailyStats: Record<string, { date: string, revenue: number, orders: number }> = {};
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyStats[d] = { date: d, revenue: 0, orders: 0 };
    }

    ordersGrowth.forEach(order => {
      const d = format(order.createdAt, 'yyyy-MM-dd');
      if (dailyStats[d]) {
        dailyStats[d].revenue += order.amount;
        dailyStats[d].orders += 1;
      }
    });

    const growthChart = Object.values(dailyStats);

    // 4. Recent Products Overview
    const recentProducts = await prisma.product.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { items: { where: { isSold: false } } }
        }
      }
    });

    // 5. Recent Orders Overview
    const recentOrders = await prisma.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: { select: { title: true, thumbnail: true } },
        buyer: { select: { username: true } },
      }
    });

    return NextResponse.json({
      revenue: revenueData._sum.amount || 0,
      totalOrders,
      totalProducts,
      activeProducts,
      totalStock,
      openDisputes,
      growthChart,
      recentProducts,
      recentOrders
    });
  } catch (error) {
    console.error('Fetch seller stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
