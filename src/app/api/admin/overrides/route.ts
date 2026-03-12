import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const rawOverrides = await prisma.userOverride.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Manually join user data to avoid schema relation missing error
    const userIds = rawOverrides.map(o => o.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true }
    });
    
    const overrides = rawOverrides.map(o => ({
      ...o,
      user: users.find(u => u.id === o.userId) || { username: 'Unknown', email: '' }
    }));
    
    return NextResponse.json({ overrides });
  } catch (error: any) {
    console.error('Fetch overrides error:', error);
    return NextResponse.json({ error: 'Lỗi lấy danh sách ngoại lệ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { username, maxBooths, maxItemsPerOrder, commissionRate, note } = data;

    if (!username) return NextResponse.json({ error: 'Thiếu tên người dùng' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });

    const rawOverride = await prisma.userOverride.upsert({
      where: { userId: user.id },
      update: { maxBooths, maxItemsPerOrder, commissionRate, note },
      create: {
        userId: user.id,
        maxBooths, maxItemsPerOrder, commissionRate, note
      }
    });

    const override = {
      ...rawOverride,
      user: { username: user.username, email: user.email }
    };

    return NextResponse.json({ success: true, override });
  } catch (error: any) {
    console.error('Create override error:', error);
    return NextResponse.json({ error: 'Lỗi lưu ngoại lệ' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Thiếu ID ngoại lệ' }, { status: 400 });

    await prisma.userOverride.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete override error:', error);
    return NextResponse.json({ error: 'Lỗi xóa ngoại lệ' }, { status: 500 });
  }
}
