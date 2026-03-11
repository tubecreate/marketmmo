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
  createdAt: string;
  _count?: { buyerOrders: number };
}

interface AuthCtx {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mmo_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

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
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    setUser(data.user);
    localStorage.setItem('mmo_user', JSON.stringify(data.user));
    return {};
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return {};
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mmo_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
