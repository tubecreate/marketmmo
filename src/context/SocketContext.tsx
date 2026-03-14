'use client';
// Force rebuild to resolve persistent useSession error cache

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Determine socket URL: 
    // In production, we usually use the same domain to avoid "Private Network Access" popups.
    // In development, if accessing via a domain, localhost might trigger warnings.
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? `https://${window.location.hostname}/socket.io` // Assuming proxy is set up
      : 'http://localhost:3001');

    const socketInstance = io(socketUrl, {
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket.io connected:', socketInstance.id);
      setConnected(true);
      
      // If user is logged in, join their private room
      if (user?.id) {
        socketInstance.emit('join-user-room', user.id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setConnected(false);
    });

    // Use a microtask to avoid "setState within effect" warning
    Promise.resolve().then(() => {
      setSocket(socketInstance);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
