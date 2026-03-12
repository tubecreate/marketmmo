'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Chip, CircularProgress, Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';
import SiteLayout from '@/components/layout/SiteLayout';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Message { id: string; senderId: string; senderRole: string; message: string; createdAt: string; }
interface Dispute {
  id: string; status: string; reason: string; evidence: string | null; faultyCount: number;
  resolution: string | null; sellerReply: string | null; adminDecision: string | null;
  order: {
    id: string; amount: number; quantity: number; variantName: string | null;
    product: { title: string; }; buyer: { id: string; username: string; }; seller: { id: string; username: string; };
  };
}

export default function BuyerDisputeChatPage() {
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
        fetch(`/api/disputes?buyerId=${user?.id}`),
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
      const role = user.role === 'ADMIN' ? 'ADMIN' : (user.id === dispute.order.buyer.id ? 'BUYER' : 'SELLER');
      const res = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, senderRole: role, message: newMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMsg('');
        setMessages(prev => [...prev, data.message]);
      } else {
        toast.error(data.error || 'Lỗi gửi tin nhắn');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSending(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return { bg: '#fef3c7', color: '#92400e', label: 'Admin' };
      case 'SELLER': return { bg: '#dbeafe', color: '#1e40af', label: 'Người bán' };
      case 'BUYER': return { bg: '#dcfce7', color: '#166534', label: 'Người mua (Bạn)' };
      default: return { bg: '#f1f5f9', color: '#475569', label: role };
    }
  };

  if (loading) return <SiteLayout><Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box></SiteLayout>;
  if (!dispute) return <SiteLayout><Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}><Alert severity="error">Không tìm thấy khiếu nại hoặc bạn không có quyền truy cập</Alert></Box></SiteLayout>;

  return (
    <SiteLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, mb: 8 }}>
        {/* Header */}
        <Paper sx={{ p: 2.5, mb: 0, borderRadius: '12px 12px 0 0', background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/tai-khoan/don-hang')}
                sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, mb: 0.5, fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}>
                Quay lại đơn hàng
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon /> Phòng Tranh Chấp
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {dispute.order.product.title} · #{dispute.order.id.slice(-8).toUpperCase()}
              </Typography>
            </Box>
            <Chip label={dispute.status === 'ESCALATED' ? 'Đang giải quyết' : dispute.status}
              sx={{ fontWeight: 800, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
          </Box>
        </Paper>

        {/* Case info bar */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, display: 'flex', gap: 4, bgcolor: '#f8fafc' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Trạng thái</Typography>
            <Typography variant="body2" fontWeight={800} color="warning.main">Admin đang xem xét</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Shop</Typography>
            <Typography variant="body2" fontWeight={700}>@{dispute.order.seller.username}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Items lỗi / Tổng</Typography>
            <Typography variant="body2" fontWeight={700}>{dispute.faultyCount} / {dispute.order.quantity}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>Tổng giá trị</Typography>
            <Typography variant="body2" fontWeight={800} color="error">{dispute.order.amount.toLocaleString('vi-VN')}đ</Typography>
          </Box>
        </Paper>

        {/* Chat area */}
        <Paper variant="outlined" sx={{ borderTop: 0, borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <Box sx={{ height: 450, overflow: 'auto', p: 3, bgcolor: '#fafafa' }}>
            {/* Dispute reason */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
              <Typography variant="caption" fontWeight={700} color="#92400e">LÝ DO BẠN KHIẾU NẠI:</Typography>
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
                    p: 2, maxWidth: '75%', borderRadius: 3,
                    bgcolor: isMe ? '#16a34a' : 'white',
                    color: isMe ? 'white' : '#334155',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip label={rc.label} size="small" sx={{ fontSize: '0.62rem', fontWeight: 800, bgcolor: isMe ? 'rgba(255,255,255,0.2)' : rc.bg, color: isMe ? 'white' : rc.color, height: 20 }} />
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
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
            <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, bgcolor: 'white' }}>
              <TextField
                fullWidth size="small"
                placeholder="Nhập tin nhắn cho Admin và Người bán..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                InputProps={{ sx: { borderRadius: 2, bgcolor: '#f8fafc' } }}
              />
              <Button
                variant="contained" disableElevation
                disabled={!newMsg.trim() || sending}
                onClick={handleSend}
                sx={{ borderRadius: 2, minWidth: 50, background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' }}
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
              <Typography variant="body1" color="text.primary" fontWeight={700} sx={{ mb: 1 }}>
                Phiên tranh chấp đã kết thúc.
              </Typography>
              {dispute.adminDecision && (
                <Alert severity="info" sx={{ display: 'inline-flex', textAlign: 'left', borderRadius: 2 }}>
                  <strong>Quyết định từ Admin:</strong> {dispute.adminDecision}
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </SiteLayout>
  );
}
