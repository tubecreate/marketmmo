import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function getUser(req?: Request) {
  // 1. Try cookie first
  const token = (await cookies()).get('auth-token')?.value;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
      const { payload } = await jose.jwtVerify(token, secret);
      return payload as { id: string; role: string; username: string };
    } catch { /* ignore and try fallback */ }
  }

  // 2. Fallback to userId in query params (consistent with rest of project)
  if (req) {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      if (userId) {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, username: true } });
        return u;
      }
    } catch { /* ignore */ }
  }
  
  return null;
}

// GET /api/chat/rooms
export async function GET(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const participants = await prisma.chatParticipant.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            participants: {
              where: { userId: { not: user.id } }, // Get the other person
              include: { user: { select: { id: true, username: true, avatar: true } } }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { room: { updatedAt: 'desc' } }
    });

    const rooms = participants.map(p => {
      const otherParticipant = p.room.participants[0]; // For 1-1 chat
      const isSystemBot = otherParticipant?.userId === 'SYSTEM_BOT';
      
      return {
        id: p.room.id,
        isGroup: p.room.isGroup,
        unreadCount: p.room.messages.filter(m => {
          // Robust comparison
          const lastReadTime = p.lastRead ? new Date(p.lastRead).getTime() : 0;
          const msgTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          return msgTime > lastReadTime && m.senderId !== user.id;
        }).length,
        lastMessage: p.room.messages[0] || null,
        otherUser: isSystemBot ? {
          id: 'SYSTEM_BOT',
          username: 'Hệ thống',
          isSystem: true
        } : (otherParticipant?.user || { id: 'unknown', username: 'Người dùng' }),
        updatedAt: p.room.updatedAt
      };
    });

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('[API] Fetch chat rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms', details: error.message }, { status: 500 });
  }
}

// POST /api/chat/rooms
// Create or get a room with a specific user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUserId, userId: bodyUserId } = body;
    
    // Help getUser by providing fallback via body if needed
    let user: any = await getUser(req);
    if (!user && bodyUserId) {
      user = await prisma.user.findUnique({ where: { id: bodyUserId }, select: { id: true, role: true, username: true } });
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
    }

    // 1. Check if room exists
    let room = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      }
    });

    // 2. If not, create it
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
    }

    return NextResponse.json({ success: true, roomId: room.id });
  } catch (error: any) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
