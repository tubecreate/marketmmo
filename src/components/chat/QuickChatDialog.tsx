'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton,
  Avatar, CircularProgress, alpha,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import Link from 'next/link';

interface QuickChatDialogProps {
  open: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    username: string;
    avatar?: string | null;
  } | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isSystem: boolean;
}

export default function QuickChatDialog({ open, onClose, targetUser }: QuickChatDialogProps) {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 520 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Reset position on open
  useEffect(() => {
    if (open) {
      setPosition({ x: window.innerWidth - 420, y: window.innerHeight - 520 });
    }
  }, [open]);
  
  const fetchMessages = useCallback(async (rid: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/chat/rooms/${rid}?userId=${user.id}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error('Fetch quick chat messages error:', err);
    }
  }, [user]);

  // Init room
  useEffect(() => {
    if (open && targetUser && user) {
      const initRoom = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: targetUser.id, userId: user.id })
          });
          const data = await res.json();
          if (data.success && data.roomId) {
            setRoomId(data.roomId);
            await fetchMessages(data.roomId);
          }
        } catch (err) {
          console.error('Init quick chat room error:', err);
        } finally {
          setLoading(false);
        }
      };
      initRoom();
    } else if (!open) {
      setRoomId(null);
      setMessages([]);
      setNewMsg('');
    }
  }, [open, targetUser, user, fetchMessages]);

  // Polling
  useEffect(() => {
    if (!open || !roomId || !user) return;
    const interval = setInterval(() => {
      fetchMessages(roomId);
    }, 4000);
    return () => clearInterval(interval);
  }, [open, roomId, user, fetchMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !roomId || !user || !targetUser) return;
    
    setSending(true);
    const content = newMsg.trim();
    setNewMsg('');

    // Optimistic update
    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      isSystem: false
    }]);

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          content,
          userId: user.id
        })
      });
      fetchMessages(roomId);
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const renderContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{part}</a>;
      }
      return part;
    });
  };

  if (!open) return null;

  return (
    <Paper
      elevation={12}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 380,
        height: 500,
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        transition: isDragging ? 'none' : 'all 0.1s ease-out'
      }}
    >
      <Box 
        onMouseDown={handleMouseDown}
        sx={{ 
          p: 1.5,
          bgcolor: '#16a34a', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#fff', 0.2), fontSize: '0.75rem' }}>
            {targetUser?.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '0.8rem' }}>
              {targetUser?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), fontSize: '0.6rem' }}>
              Nhấn để kéo di chuyển
            </Typography>
          </Box>
        </Box>
        <Box sx={{ pointerEvents: 'auto' }}>
          <Tooltip title="Mở trang chat đầy đủ">
            <IconButton 
              size="small" 
              component={Link}
              href={`/user_chat?userId=${targetUser?.id}`}
              sx={{ color: 'white', mr: 0.25 }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ 
        p: 2, 
        flex: 1, 
        overflowY: 'auto', 
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {loading ? (
          <Box sx={{ m: 'auto', textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#16a34a' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ m: 'auto', textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Bắt đầu trò chuyện với <b>{targetUser?.username}</b>
            </Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            return (
              <Box key={msg.id || idx} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <Paper sx={{
                  p: 1.25,
                  px: 1.75,
                  maxWidth: '85%',
                  borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  bgcolor: isMe ? '#16a34a' : 'white',
                  color: isMe ? 'white' : '#1e293b',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: isMe ? 'none' : '1px solid #e2e8f0'
                }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {renderContent(msg.content)}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    fontSize: '0.6rem', 
                    opacity: 0.7,
                    textAlign: isMe ? 'right' : 'left'
                  }}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </Typography>
                </Paper>
              </Box>
            );
          })
        )}
        <div ref={chatEndRef} />
      </Box>

      <Box sx={{ p: 1.5, pt: 1, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Nhập tin nhắn..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading || sending}
          InputProps={{
            sx: { borderRadius: 4, bgcolor: '#f1f5f9', fontSize: '0.8rem', '& fieldset': { border: 'none' } }
          }}
        />
        <IconButton 
          onClick={handleSend} 
          disabled={!newMsg.trim() || loading || sending}
          sx={{ 
            bgcolor: '#16a34a', 
            color: 'white', 
            '&:hover': { bgcolor: '#15803d' },
            '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }
          }}
        >
          {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
    </Paper>
  );
}
