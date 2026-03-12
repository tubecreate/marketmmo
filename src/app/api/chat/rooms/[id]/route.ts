import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function getUser(req?: Request) {
  const token = (await cookies()).get('auth-token')?.value;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
      const { payload } = await jose.jwtVerify(token, secret);
      return payload as { id: string; role: string; username: string };
    } catch { /* ignore */ }
  }

  if (req) {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      if (userId) {
        return await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, username: true } });
      }
    } catch { /* ignore */ }
  }
  return null;
}

// GET /api/chat/rooms/[id] - Lấy danh sách tin nhắn
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roomId = (await params).id;

    // Check participation
    const participant = await prisma.chatParticipant.findFirst({
      where: { roomId, userId: user.id }
    });

    if (!participant) return NextResponse.json({ error: 'Không thuộc phòng chat này' }, { status: 403 });

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' }
    });

    // Cập nhật lastRead
    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { lastRead: new Date() }
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Lỗi tải tin nhắn' }, { status: 500 });
  }
}
