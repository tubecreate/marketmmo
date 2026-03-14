import { prisma } from '@/lib/db';
import { broadcastToSocket } from './socket-broadcaster';

export async function createNotification({
  userId,
  title,
  content,
  type,
  targetUrl
}: {
  userId: string;
  title: string;
  content: string;
  type: 'ORDER_UPDATE' | 'CHAT' | 'SYSTEM';
  targetUrl?: string;
}) {
  try {
    const id = 'notif_' + Math.random().toString(36).substring(2, 11);
    const createdAt = new Date().toISOString();
    
    // Using executeRawUnsafe to bypass Prisma model visibility issues
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO Notification (id, userId, title, content, type, targetUrl, isRead, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      id, userId, title, content, type, targetUrl || null, createdAt
    );

    // Broadcast via Socket.io
    broadcastToSocket(`user:${userId}`, 'notification:new', { id, title, content, type, targetUrl, createdAt });
    
    console.log('Notification created via raw SQL:', id);
    return { id, userId, title };
  } catch (error) {
    console.error('Error creating notification via raw SQL:', error);
    // Fallback to model-based if SQL fails (unlikely if table exists)
    try {
      if ((prisma as any).notification) {
        const notif = await (prisma as any).notification.create({
          data: { userId, title, content, type, targetUrl }
        });
        if (notif) {
          broadcastToSocket(`user:${userId}`, 'notification:new', notif);
        }
        return notif;
      }
    } catch (e) {
      console.error('Fallback notification creation also failed:', e);
    }
    return null;
  }
}
