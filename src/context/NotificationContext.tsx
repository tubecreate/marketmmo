'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCtx {
  notifications: Notification[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId?: string, markAll?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationCtx>({
  notifications: [],
  unreadNotificationsCount: 0,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/me/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user]);

  const markAsRead = async (notificationId?: string, markAll?: boolean) => {
    if (!user) return;
    try {
      const res = await fetch('/api/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, notificationId, markAll })
      });
      if (res.ok) {
        await refreshNotifications();
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        refreshNotifications();
      }, 0);
      
      const interval = setInterval(refreshNotifications, 30000); // Poll every 30s as fallback
      
      // Socket.io Real-time
      if (socket) {
        socket.on('notification:new', (payload: any) => {
          console.log('New notification received via Socket.io:', payload);
          refreshNotifications(); // Or we can optimize by appending the new notification directly
        });
      }

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
        if (socket) {
          socket.off('notification:new');
        }
      };
    } else {
      setTimeout(() => {
        setNotifications([]);
        setUnreadNotificationsCount(0);
      }, 0);
    }
  }, [user, refreshNotifications, socket]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadNotificationsCount, refreshNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
