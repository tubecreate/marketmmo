'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, TextField, Button, Avatar, IconButton,
  Badge, CircularProgress, InputBase, Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatRoom {
  id: string;
  isGroup: boolean;
  unreadCount: number;
  updatedAt: string;
  otherUser?: { id: string; username: string; avatar: string | null; isSystem?: boolean; };
  lastMessage?: ChatMessage | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isSystem: boolean;
}

export default function UserChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch rooms logic
  const fetchRooms = useCallback(async () => {
    if (!user) {
      setLoadingRooms(false);
      return;
    }
    try {
      const res = await fetch(`/api/chat/rooms?userId=${user.id}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (data.rooms) {
        // Sort System_Bot first
        const sorted = data.rooms.sort((a: ChatRoom, b: ChatRoom) => {
          if (a.otherUser?.isSystem) return -1;
          if (b.otherUser?.isSystem) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setRooms(sorted);
      }
    } catch { /* ignore */ } finally { setLoadingRooms(false); }
  }, [user]);

  // Fetch messages logic
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!activeRoomId || !user) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}?userId=${user.id}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch { /* ignore */ } finally { if (showLoading) setLoadingMessages(false); }
  }, [activeRoomId, user]);

  useEffect(() => { 
    const initChat = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetUserId = urlParams.get('userId');

      if (targetUserId && user && targetUserId !== user.id) {
        try {
          const res = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ targetUserId, userId: user.id })
          });
          const data = await res.json();
          if (data.success && data.roomId) {
            setActiveRoomId(data.roomId);
            
            // Send automated order message?
            const orderId = urlParams.get('orderId');
            const orderTitle = urlParams.get('title');
            if (orderId && orderTitle) {
              const sellerLink = `${window.location.origin}/ban-hang/don-hang?q=${orderId}`;
              const autoMsg = `[HỖ TRỢ ĐƠN HÀNG]\nSản phẩm: ${orderTitle}\nMã đơn: #${orderId.slice(-8).toUpperCase()}\nLink kiểm tra: ${sellerLink}`;
              
              try {
                await fetch('/api/chat/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'same-origin',
                  body: JSON.stringify({ 
                    targetUserId, 
                    content: autoMsg,
                    userId: user.id
                  })
                });
              } catch (msgErr) {
                console.error('Failed to send auto message', msgErr);
              }
            }

            // Add a temporary optimistic room to the sidebar
            setRooms((prev) => {
              if (prev.some(r => r.id === data.roomId)) return prev;
              const newRoom = {
                id: data.roomId,
                isGroup: false,
                unreadCount: 0,
                updatedAt: new Date().toISOString(),
                otherUser: { id: targetUserId, username: 'Đang tải...', avatar: null }
              };
              return [newRoom, ...prev];
            });

            window.history.replaceState(null, '', '/user_chat');
          }
        } catch (err) {
          console.error('Failed to init direct chat', err);
        }
      }
      await fetchRooms();
    };
    
    if (user) {
      initChat();
    }
  }, [user, fetchRooms]);

  // Polling for updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { fetchRooms(); }, 5000);
    return () => clearInterval(interval);
  }, [user, fetchRooms]);

  // Fetch messages when room is selected
  useEffect(() => {
    if (!activeRoomId) return;
    fetchMessages(true);
    
    // Set unread count to 0 locally
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, unreadCount: 0 } : r));
  }, [activeRoomId, fetchMessages]);

  // Polling for messages in active room
  useEffect(() => {
    if (!activeRoomId || !user) return;
    const interval = setInterval(() => { fetchMessages(false); }, 3000);
    return () => clearInterval(interval);
  }, [activeRoomId, user, fetchMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeRoomId || !user) return;
    
    const activeRoom = rooms.find(r => r.id === activeRoomId);
    if (!activeRoom || !activeRoom.otherUser || activeRoom.otherUser.isSystem) return; // Cannot chat with bot directly in normal way

    const tempMsg = {
      id: 'temp-' + Date.now(),
      senderId: user.id,
      content: newMsg.trim(),
      createdAt: new Date().toISOString(),
      isSystem: false
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMsg('');

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ 
          targetUserId: activeRoom.otherUser.id, 
          content: tempMsg.content,
          userId: user.id
        })
      });
      fetchRooms(); // refresh to get real ID and update last message
    } catch { /* ignore */ }
  };

  const renderContentWithLinks = (content: string) => {
    if (!content) return null;

    // 1. Regex for Markdown Links: [label](url)
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    // 2. Regex for Order IDs: #ABC123XY (8+ alphanumeric after #)
    const orderIdRegex = /#([A-Z0-9]{8,})/g;
    // 3. Regex for plain URLs (that aren't already part of a markdown link)
    const urlRegex = /(?<!\()https?:\/\/[^\s\)]+/g;

    let parts: (string | React.ReactNode)[] = [content];

    // Helper to process parts array with a regex and a replacement function
    const processParts = (regex: RegExp, replacer: (match: string, ...args: string[]) => React.ReactNode) => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        
        let lastIndex = 0;
        let match;
        const currentRegex = new RegExp(regex); // Clone to avoid state issues
        while ((match = currentRegex.exec(part)) !== null) {
          // Push text before match
          if (match.index > lastIndex) {
            newParts.push(part.substring(lastIndex, match.index));
          }
          // Push replacement element
          newParts.push(replacer(match[0], ...match.slice(1)));
          lastIndex = currentRegex.lastIndex;
        }
        // Push remaining text
        if (lastIndex < part.length) {
          newParts.push(part.substring(lastIndex));
        }
      });
      parts = newParts;
    };

    // Apply processors in order
    
    // Support [Label](URL)
    processParts(mdLinkRegex, (_, label, url) => (
      <a key={url + label} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}>
        {label}
      </a>
    ));

    // Support #ORDER_ID auto-linking with context-aware redirection
    processParts(orderIdRegex, (match, id) => {
      const handleClick = async () => {
        if (!user?.id) return;
        
        try {
          // Check role for this specific order
          const res = await fetch(`/api/orders/${id.toLowerCase()}/role?userId=${user.id}`);
          const data = await res.json();
          
          if (data.role === 'SELLER') {
            router.push(`/ban-hang/khieu-nai?q=${id.toLowerCase()}`);
          } else {
            // Default to buyer view (or if role is BUYER)
            router.push(`/tai-khoan/don-hang?q=${id.toLowerCase()}`);
          }
        } catch (err) {
          console.error('Failed to resolve order role', err);
          // Fallback to safe buyer view
          router.push(`/tai-khoan/don-hang?q=${id.toLowerCase()}`);
        }
      };

      return (
        <Box 
          component="span" key={match}
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          sx={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700, '&:hover': { color: '#1d4ed8' } }}
        >
          {match}
        </Box>
      );
    });

    // Support lingering plain URLs
    processParts(urlRegex, (url) => (
      <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}>
        {url}
      </a>
    ));

    return <>{parts}</>;
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 150px)', maxWidth: 1200, mx: 'auto', mt: 4, mb: 4, borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      {/* Sidebar */}
      <Box sx={{ width: 320, flexShrink: 0, bgcolor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 800 }}>Gần đây</Typography>
          <IconButton size="small" sx={{ color: '#94a3b8', bgcolor: '#334155', borderRadius: 1.5, '&:hover': { bgcolor: '#475569' } }}>
            <VolumeOffIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ bgcolor: '#0f172a', borderRadius: 2, display: 'flex', alignItems: 'center', px: 1.5, py: 1 }}>
            <SearchIcon sx={{ color: '#64748b', fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Tìm kiếm người đã nhắn..." sx={{ color: 'white', fontSize: '0.85rem', width: '100%' }} />
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 1, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#475569', borderRadius: 3 } }}>
          {loadingRooms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} sx={{ color: '#16a34a' }} /></Box>
          ) : rooms.map(room => {
            const isSelected = room.id === activeRoomId;
            const other = room.otherUser;
            return (
              <Box key={room.id} onClick={() => setActiveRoomId(room.id)} sx={{
                display: 'flex', alignItems: 'center', p: 1.5, mb: 0.5, borderRadius: 2, cursor: 'pointer',
                bgcolor: isSelected ? '#334155' : 'transparent', '&:hover': { bgcolor: isSelected ? '#334155' : '#1e293b' },
                transition: 'all 0.2s ease', position: 'relative'
              }}>
                <Badge color="error" variant="dot" invisible={room.unreadCount === 0} sx={{ '& .MuiBadge-badge': { right: 4, top: 4, border: '2px solid #1e293b' } }}>
                  <Avatar sx={{ 
                    bgcolor: other?.isSystem ? '#ea580c' : '#16a34a', 
                    width: 44, height: 44, mr: 1.5,
                    border: '2px solid', borderColor: other?.isSystem ? '#fdba74' : 'transparent'
                  }}>
                    {other?.isSystem ? <SmartToyIcon /> : other?.username.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: isSelected || room.unreadCount > 0 ? 800 : 600, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {other?.isSystem ? 'System_Bot' : other?.username}
                      {other?.isSystem && <Chip label="BOT" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, bgcolor: '#8b5cf6', color: 'white' }} />}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                      {room.updatedAt ? format(new Date(room.updatedAt), 'dd/MM/yyyy') : ''}
                    </Typography>
                  </Box>
                  <Typography variant="caption" noWrap sx={{ color: room.unreadCount > 0 ? 'white' : '#94a3b8', display: 'block', fontWeight: room.unreadCount > 0 ? 600 : 400 }}>
                    {room.lastMessage ? (room.lastMessage.senderId === user?.id ? `Bạn: ${room.lastMessage.content}` : room.lastMessage.content) : 'Chưa có tin nhắn'}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
        {activeRoomId && !activeRoom ? (
          <Box sx={{ m: 'auto', textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ color: '#16a34a' }} />
            <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>Đang mở phòng chat...</Typography>
          </Box>
        ) : !activeRoom ? (
          <Box sx={{ m: 'auto', textAlign: 'center', color: '#64748b' }}>
            <Box sx={{ display: 'inline-flex', p: 3, borderRadius: '50%', bgcolor: '#f8fafc', mb: 3 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 64, color: '#cbd5e1' }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="#1e293b">Chọn một cuộc trò chuyện</Typography>
            <Typography variant="body2" mt={1}>Bắt đầu nhắn tin với người bán hoặc người mua</Typography>
            <Button variant="contained" sx={{ mt: 3, borderRadius: 2, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
              Chat với Admin
            </Button>
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: activeRoom.otherUser?.isSystem ? '#ea580c' : '#16a34a', width: 40, height: 40 }}>
                  {activeRoom.otherUser?.isSystem ? <SmartToyIcon /> : activeRoom.otherUser?.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} display="flex" alignItems="center" gap={1}>
                    {activeRoom.otherUser?.isSystem ? 'System_Bot' : activeRoom.otherUser?.username}
                    {activeRoom.otherUser?.isSystem && <Chip label="BOT" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#8b5cf6', color: 'white' }} />}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeRoom.otherUser?.isSystem ? 'Luôn cập nhật thông báo tự động cho bạn' : 'Hoạt động gần đây'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {loadingMessages ? (
                <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress size={24} sx={{ color: '#16a34a' }} /></Box>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === user?.id;
                  const showTime = index === 0 || new Date(msg.createdAt).getTime() - new Date(messages[index-1].createdAt).getTime() > 10 * 60 * 1000;
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showTime && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
                            {format(new Date(msg.createdAt), 'HH:mm • dd/MM/yyyy', { locale: vi })}
                          </Typography>
                        </Box>
                      )}
                      
                      {msg.isSystem ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                          <Paper sx={{ p: 1.5, px: 2, borderRadius: 3, bgcolor: '#fef2f2', border: '1px solid #fecaca', maxWidth: '80%', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <Box sx={{ mt: 0.5, color: '#dc2626' }}><SmartToyIcon fontSize="small" /></Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 800 }}>THÔNG BÁO TỪ HỆ THỐNG</Typography>
                              <Typography variant="body2" sx={{ color: '#991b1b', mt: 0.5, fontWeight: 500 }}>
                                {renderContentWithLinks(msg.content)}
                              </Typography>
                            </Box>
                          </Paper>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1 }}>
                          {!isMe && (
                            <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 'auto', bgcolor: '#16a34a' }}>
                              {activeRoom.otherUser?.username.charAt(0).toUpperCase()}
                            </Avatar>
                          )}
                          <Paper sx={{
                            p: 1.5, px: 2.5, maxWidth: '65%', position: 'relative',
                            bgcolor: isMe ? '#16a34a' : 'white',
                            color: isMe ? 'white' : '#1e293b',
                            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            boxShadow: 'min', border: isMe ? 'none' : '1px solid #e2e8f0'
                          }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {renderContentWithLinks(msg.content)}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </React.Fragment>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {activeRoom.otherUser?.isSystem ? (
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, textAlign: 'center', fontStyle: 'italic', py: 1 }}>
                  Không thể trả lời System_Bot. Nếu cần hỗ trợ, vui lòng Chat với Admin.
                </Typography>
              ) : (
                <>
                  <TextField
                    fullWidth size="small"
                    placeholder="Nhập tin nhắn..."
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    InputProps={{ sx: { borderRadius: 8, bgcolor: '#f8fafc', px: 1, '& fieldset': { border: 'none' } } }}
                  />
                  <IconButton
                    disabled={!newMsg.trim()}
                    onClick={handleSend}
                    sx={{
                      bgcolor: '#16a34a', color: 'white', '&:hover': { bgcolor: '#15803d' },
                      '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
