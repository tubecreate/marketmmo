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

// POST /api/chat/messages
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUserId, content, userId: bodyUserId } = body;

    let user: any = await getUser(req);
    if (!user && bodyUserId) {
      user = await prisma.user.findUnique({ where: { id: bodyUserId }, select: { id: true, role: true, username: true } });
    }
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!targetUserId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 });
    }

    // Tự chat với chính mình?
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Không thể tự chat với chính mình' }, { status: 400 });
    }

    // 1. Tìm xem phòng chat 1-1 đã tồn tại chưa
    let room = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      }
    });

    // 2. Nếu chưa có, tạo phòng chat mới
    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: user.id },
              { userId: targetUserId }
            ]
          }
        }
      });
    } else {
      // Update room updatedAt
      await prisma.chatRoom.update({
        where: { id: room.id },
        data: { updatedAt: new Date() }
      });
    }

    // 3. Tạo tin nhắn
    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: user.id,
        content: content.trim(),
        isSystem: false
      }
    });

    // Cập nhật lastRead cho người gửi
    await prisma.chatParticipant.updateMany({
      where: { roomId: room.id, userId: user.id },
      data: { lastRead: new Date() }
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Lỗi gửi tin nhắn' }, { status: 500 });
  }
}
