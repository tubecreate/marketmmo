import { prisma } from './db';
import { broadcastToSocket } from './socket-broadcaster';

const SYSTEM_BOT_ID = 'SYSTEM_BOT';

/**
 * Gửi tin nhắn tự động từ System_Bot cho một người dùng.
 * Hàm này sẽ tạo phòng chat với SYSTEM_BOT nếu chưa có.
 */
export async function sendSystemMessage(userId: string, content: string) {
  if (!userId) return; // Bảo vệ nếu userId bị undefined
  
  try {
    // 0. Đảm bảo SYSTEM_BOT user tồn tại để không lỗi Relation
    await prisma.user.upsert({
      where: { id: SYSTEM_BOT_ID },
      update: {},
      create: {
        id: SYSTEM_BOT_ID,
        username: 'Hệ thống',
        email: 'system@marketmmo.com',
        fullName: 'Chăm sóc khách hàng',
        passwordHash: 'n/a',
        role: 'ADMIN',
        isActive: true,
        avatar: 'https://cdn-icons-png.flaticon.com/512/2593/2593635.png'
      }
    });

    // 1. Tìm phòng chat giữa user và SYSTEM_BOT
    let room = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: SYSTEM_BOT_ID } } }
        ]
      }
    });

    // 2. Không có thì tạo mới
    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: userId },
              { userId: SYSTEM_BOT_ID }
            ]
          }
        }
      });
    } else {
      // Cập nhật updatedAt của room
      await prisma.chatRoom.update({
        where: { id: room.id },
        data: { updatedAt: new Date() }
      });
    }

    // 3. Tạo tin nhắn với isSystem = true
    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: SYSTEM_BOT_ID,
        content: content,
        isSystem: true
      }
    });

    // Notify via Socket.io
    broadcastToSocket(`room:${room.id}`, 'message:new', message);
    broadcastToSocket(`user:${userId}`, 'room:update', {});

  } catch (error) {
    console.error('Failed to send system message to', userId, error);
  }
}
