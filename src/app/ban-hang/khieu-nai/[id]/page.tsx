'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Chip, CircularProgress, Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

interface Message { id: string; senderId: string; senderRole: string; message: string; createdAt: string; }
interface Dispute {
  id: string; status: string; reason: string; evidence: string | null; faultyCount: number;
  resolution: string | null; sellerReply: string | null; adminDecision: string | null;
  order: {
    id: string; amount: number; quantity: number; variantName: string | null;
    product: { title: string; }; buyer: { id: string; username: string; }; seller: { id: string; username: string; };
  };
}

export default function DisputeChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const disputeId = params?.id as string;

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!disputeId) return;
    try {
      const [dRes, mRes] = await Promise.all([
        fetch(`/api/disputes?sellerId=${user?.id}`),
        fetch(`/api/disputes/${disputeId}/messages`),
      ]);
      const dData = await dRes.json();
      const mData = await mRes.json();
      const found = (dData.disputes || []).find((d: Dispute) => d.id === disputeId);
      if (found) setDispute(found);
      setMessages(mData.messages || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [disputeId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  // Polling for new messages
  useEffect(() => {
    if (!disputeId || dispute?.status !== 'ESCALATED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/disputes/${disputeId}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [disputeId, dispute?.status]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user || !dispute) return;
    setSending(true);
    try {
      const role = user.role === 'ADMIN' ? 'ADMIN' : (user.id === dispute.order.seller.id ? 'SELLER' : 'BUYER');
      const res = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, senderRole: role, message: newMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMsg('');
        setMessages(prev => [...prev, data.message]);
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return { bg: '#fef3c7', color: '#92400e', label: 'Admin' };
      case 'SELLER': return { bg: '#dbeafe', color: '#1e40af', label: 'Người bán' };
      case 'BUYER': return { bg: '#dcfce7', color: '#166534', label: 'Người mua' };
      default: return { bg: '#f1f5f9', color: '#475569', label: role };
    }
  };

  if (loading) return <SellerLayout><Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box></SellerLayout>;
  if (!dispute) return <SellerLayout><Alert severity="error" sx={{ m: 4 }}>Không tìm thấy khiếu nại</Alert></SellerLayout>;

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Paper sx={{ p: 2.5, mb: 0, borderRadius: '12px 12px 0 0', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/ban-hang/khieu-nai')}
                sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, mb: 0.5, fontSize: '0.75rem' }}>Quay lại</Button>
              <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon /> Phiên Tranh Chấp
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {dispute.order.product.title} · #{dispute.order.id.slice(-8).toUpperCase()}
              </Typography>
            </Box>
            <Chip label={dispute.status === 'ESCALATED' ? 'Đang tranh chấp' : dispute.status}
              sx={{ fontWeight: 800, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
          </Box>
        </Paper>

        {/* Case info bar */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, display: 'flex', gap: 4, bgcolor: '#f8fafc' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Người mua</Typography>
            <Typography variant="body2" fontWeight={700}>@{dispute.order.buyer.username}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Người bán</Typography>
            <Typography variant="body2" fontWeight={700}>@{dispute.order.seller.username}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Items lỗi</Typography>
            <Typography variant="body2" fontWeight={700}>{dispute.faultyCount} / {dispute.order.quantity}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Giá trị</Typography>
            <Typography variant="body2" fontWeight={800} color="error">{dispute.order.amount.toLocaleString('vi-VN')}đ</Typography>
          </Box>
        </Paper>

        {/* Chat area */}
        <Paper variant="outlined" sx={{ borderTop: 0, borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
          <Box sx={{ height: 420, overflow: 'auto', p: 3, bgcolor: '#fafafa' }}>
            {/* Dispute reason */}
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
              <Typography variant="caption" fontWeight={700} color="#92400e">LÝ DO KHIẾU NẠI:</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: '#78350f' }}>{dispute.reason}</Typography>
              {dispute.evidence && (
                <Paper sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: '#1e293b' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {dispute.evidence}
                  </Typography>
                </Paper>
              )}
            </Paper>

            {/* Messages */}
            {messages.map((msg) => {
              const rc = getRoleColor(msg.senderRole);
              const isMe = msg.senderId === user?.id;
              return (
                <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1.5 }}>
                  <Paper sx={{
                    p: 2, maxWidth: '70%', borderRadius: 2.5,
                    bgcolor: isMe ? '#1e293b' : 'white',
                    color: isMe ? 'white' : '#334155',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip label={rc.label} size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, bgcolor: rc.bg, color: rc.color, height: 20 }} />
                      <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>
                        {new Date(msg.createdAt).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.message}</Typography>
                  </Paper>
                </Box>
              );
            })}
            <div ref={chatEndRef} />
          </Box>

          {/* Chat input */}
          {dispute.status === 'ESCALATED' ? (
            <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
              <TextField
                fullWidth size="small"
                placeholder="Nhập nội dung phản hồi..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <Button
                variant="contained" disableElevation
                disabled={!newMsg.trim() || sending}
                onClick={handleSend}
                sx={{ borderRadius: 2, minWidth: 50, background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f1f5f9' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {dispute.adminDecision ? `✅ Quyết định: ${dispute.adminDecision}` : 'Phiên tranh chấp đã kết thúc.'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </SellerLayout>
  );
}
