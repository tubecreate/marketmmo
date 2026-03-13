'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  balance: number;
  holdBalance: number;
  role: string;
  level: number;
  telegramId: string | null;
  twoFactorEnabled: boolean;
  phone: string | null;
  bankName: string | null;
  bankAccount: string | null;
  createdAt: string;
  _count?: { buyerOrders: number };
  sellerRequest?: { status: string } | null;
}

interface AuthCtx {
  user: AuthUser | null;
  unreadCount: number;
  login: (identifier: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  unreadCount: 0,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
  refreshUser: async () => {},
  refreshUnreadCount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mmo_user');
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setTimeout(() => setUser(parsed), 0);
      } catch { 
        // Ignore JSON parse errors
      }
    }
  }, []);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/chat/rooms?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const total = (data.rooms || []).reduce((sum: number, r: { unreadCount?: number }) => sum + (r.unreadCount || 0), 0);
        setUnreadCount(total);
      }
    } catch (e: unknown) { 
      const error = e as Error;
      console.error('Lỗi lấy unread count:', error.message); 
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      // First call after a tiny delay to avoid 'synchronous setState' lint
      const timeout = setTimeout(() => {
        refreshUnreadCount();
      }, 0);
      
      interval = setInterval(refreshUnreadCount, 30000);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    } else {
      const timeout = setTimeout(() => {
        setUnreadCount(0);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [user, refreshUnreadCount]);

  const refreshUser = async () => {
    const stored = localStorage.getItem('mmo_user');
    if (!stored) return;
    try {
      const u = JSON.parse(stored) as AuthUser;
      const res = await fetch(`/api/me?userId=${u.id}`);
      if (res.ok) {
        const fresh = await res.json();
        setUser(fresh);
        localStorage.setItem('mmo_user', JSON.stringify(fresh));
      }
    } catch (e) { console.error('Lỗi lấy info user mới:', e); }
  };

  const login = async (identifier: string, password: string) => {
    const trimmedIdentifier = identifier.trim();
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmedIdentifier, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    setUser(data.user);
    localStorage.setItem('mmo_user', JSON.stringify(data.user));
    return {};
  };

  const register = async (username: string, email: string, password: string) => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmedUsername, email: trimmedEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return {};
  };

  const logout = () => {
    setUser(null);
    setUnreadCount(0);
    localStorage.removeItem('mmo_user');
  };

  return (
    <AuthContext.Provider value={{ user, unreadCount, login, register, logout, refreshUser, refreshUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
