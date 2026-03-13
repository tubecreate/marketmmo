'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tabs, Tab, Skeleton,
  Alert, Divider, CircularProgress,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import RefreshIcon from '@mui/icons-material/Refresh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BuildIcon from '@mui/icons-material/Build';
import ForumIcon from '@mui/icons-material/Forum';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  reason: string;
  evidence: string | null;
  faultyCount: number;
  status: string;
  resolution: string | null;
  sellerReply: string | null;
  refundAmount: number;
  createdAt: string;
  resolvedAt: string | null;
  order: {
    id: string;
    amount: number;
    quantity: number;
    variantName: string | null;
    product: { id: string; title: string; thumbnail: string | null; };
    buyer: { id: string; username: string; };
    seller: { id: string; username: string; };
  };
}

const STATUS_TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Khiếu nại', value: 'OPEN' },
  { label: 'Tranh chấp', value: 'ESCALATED' },
  { label: 'Bảo hành', value: 'WARRANTY' },
  { label: 'Lịch sử', value: 'history' },
];

export default function SellerDisputesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('all');
  const [resolveDispute, setResolveDispute] = useState<Dispute | null>(null);
  const [sellerReply, setSellerReply] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  const fetchDisputes = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const status = tabValue === 'history' ? '' : tabValue;
      const res = await fetch(`/api/disputes?sellerId=${user.id}${status && status !== 'all' ? `&status=${status}` : ''}`);
      const data = await res.json();
      let items = data.disputes || [];
      if (tabValue === 'history') {
        items = items.filter((d: Dispute) => ['REFUNDED', 'WARRANTY', 'RESOLVED', 'CLOSED'].includes(d.status));
      }
      setDisputes(items);
    } catch {
      console.error('Error fetching disputes');
    } finally {
      setLoading(false);
    }
  }, [user?.id, tabValue]);

  // 1. Initial and tab-based fetch
  useEffect(() => { 
    fetchDisputes(); 
  }, [fetchDisputes]);

  // 2. Deep-linking logic (Runs only when disputes are loaded)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    
    if (q && disputes.length > 0) {
      const target = disputes.find(d => 
        d.order.id.toLowerCase().includes(q.toLowerCase()) || 
        d.id.toLowerCase() === q.toLowerCase()
      );
      
      // Only open if found, it is OPEN, and NOT already the active resolveDispute
      if (target && target.status === 'OPEN' && resolveDispute?.id !== target.id) {
        setResolveDispute(target);
        setSellerReply('');
        setError('');
        
        // Optional: Clear 'q' to avoid re-triggering if user closes and stays on page
        // const newUrl = window.location.pathname;
        // window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    }
  }, [disputes, resolveDispute?.id]);

  const handleResolve = async (resolution: 'REFUND' | 'WARRANTY' | 'DISPUTE') => {
    if (!resolveDispute || !user) return;
    setResolving(true);
    setError('');
    try {
      const res = await fetch(`/api/disputes/${resolveDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, sellerId: user.id, sellerReply }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          resolution === 'REFUND' ? 'Hoàn tiền thành công!' : 
          resolution === 'WARRANTY' ? 'Đã cấp bảo hành!' : 
          'Đã chuyển sang tranh chấp!'
        );
        setResolveDispute(null);
        setSellerReply('');
        fetchDisputes();
      } else {
        toast.error(data.error || 'Lỗi xử lý');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setResolving(false);
    }
  };

  const getStatusChip = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      OPEN: { label: 'Chờ xử lý', color: '#dc2626', bg: '#fee2e2' },
      REFUNDED: { label: 'Đã hoàn tiền', color: '#059669', bg: '#d1fae5' },
      WARRANTY: { label: 'Đã bảo hành', color: '#2563eb', bg: '#dbeafe' },
      ESCALATED: { label: 'Tranh chấp', color: '#d97706', bg: '#fef3c7' },
      RESOLVED: { label: 'Đã giải quyết', color: '#059669', bg: '#d1fae5' },
      CLOSED: { label: 'Đã đóng', color: '#6b7280', bg: '#f3f4f6' },
    };
    const s = map[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
    return <Chip label={s.label} size="small" sx={{ fontWeight: 700, bgcolor: s.bg, color: s.color, fontSize: '0.7rem' }} />;
  };

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ bgcolor: '#dc2626', p: 3.5, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <GavelIcon /> Quản lý khiếu nại
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Xem và xử lý các yêu cầu hỗ trợ từ khách hàng.</Typography>
          </Box>
          <Button variant="contained" disableElevation startIcon={<RefreshIcon />} onClick={fetchDisputes}
            sx={{ borderRadius: 2, fontWeight: 800, bgcolor: 'white', color: '#dc2626', fontSize: '0.75rem', '&:hover': { bgcolor: '#f1f5f9' } }}>
            LÀM MỚI
          </Button>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', overflow: 'hidden' }}>
          {/* Guide */}
          <Paper sx={{ m: 2, p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400e', mb: 1 }}>📋 Hướng dẫn xử lý:</Typography>
            <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.82rem', lineHeight: 1.8 }}>
              • Người bán có <strong>24 giờ</strong> để xử lý khiếu nại trước khi hệ thống tự động hoàn tiền.<br/>
              • Sử dụng <strong>&quot;Tranh chấp&quot;</strong> nếu bạn tin rằng khách hàng sai và cần Admin can thiệp.<br/>
              • <strong>&quot;Bảo hành&quot;</strong> sẽ tự động lấy tài khoản mới từ kho cùng biến thể để giao khách.
            </Typography>
          </Paper>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
              sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.85rem' }, '& .Mui-selected': { color: '#dc2626 !important' }, '& .MuiTabs-indicator': { bgcolor: '#dc2626' } }}>
              {STATUS_TABS.map(t => <Tab key={t.value} label={t.label} value={t.value} />)}
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3 }}>
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} height={80} sx={{ borderRadius: 2, mb: 1 }} />)
            ) : disputes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ fontSize: '3rem', mb: 1 }}>📋</Typography>
                <Typography color="text.secondary" fontWeight={600}>Không có khiếu nại nào.</Typography>
              </Box>
            ) : (
              disputes.map((d) => (
                <Paper key={d.id} variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2, '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2' }, transition: '0.2s' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        {getStatusChip(d.status)}
                        <Typography variant="caption" color="text.secondary">#{d.order.id.slice(-8).toUpperCase()}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(d.createdAt).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {d.order.product.title}
                        {d.order.variantName && <Typography component="span" variant="body2" color="text.secondary"> — {d.order.variantName}</Typography>}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Người mua: <strong>@{d.order.buyer.username}</strong> · Số lượng lỗi: <strong>{d.faultyCount}</strong> / {d.order.quantity}
                      </Typography>
                      <Paper sx={{ p: 1.5, bgcolor: '#fef3c7', borderRadius: 1.5, mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#92400e', fontSize: '0.82rem' }}>
                          Lý do từ <strong>@{d.order.buyer.username}</strong>:<br/>{d.reason}
                        </Typography>
                      </Paper>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                        Khiếu nại {((d.order.amount / d.order.quantity) * d.faultyCount).toLocaleString('vi-VN')}đ
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        (Gốc: {d.order.amount.toLocaleString('vi-VN')}đ)
                      </Typography>
                      {d.status === 'OPEN' && (
                        <Button variant="contained" size="small" color="warning"
                          onClick={() => { setResolveDispute(d); setSellerReply(''); setError(''); }}
                          sx={{ mt: 1, fontWeight: 700, borderRadius: 2, fontSize: '0.75rem' }}>
                          ⚡ Giải quyết
                        </Button>
                      )}
                      {d.status === 'ESCALATED' && (
                        <Button variant="contained" size="small" startIcon={<ForumIcon />}
                          onClick={() => router.push(`/ban-hang/khieu-nai/${d.id}`)}
                          sx={{ mt: 1, fontWeight: 700, borderRadius: 2, fontSize: '0.75rem', bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}>
                          Phòng tranh chấp
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </Paper>
      </Box>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDispute} onClose={() => setResolveDispute(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚡ Giải quyết Khiếu nại
          <Chip label={`#${resolveDispute?.order.id.slice(-8).toUpperCase()}`} size="small" sx={{ fontWeight: 700 }} />
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {resolveDispute && (
            <>
              {/* Order info */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>SẢN PHẨM</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resolveDispute.order.product.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{resolveDispute.order.variantName || 'Mặc định'}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>SỐ LƯỢNG</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resolveDispute.faultyCount} lỗi</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>GIÁ TRỊ KHIẾU NẠI</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                      {((resolveDispute.order.amount / resolveDispute.order.quantity) * resolveDispute.faultyCount).toLocaleString('vi-VN')}đ
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Buyer reason */}
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#fef3c7' }}>
                <Typography variant="body2" sx={{ color: '#92400e' }}>
                  Lý do từ <strong>@{resolveDispute.order.buyer.username}</strong>:<br/>{resolveDispute.reason}
                </Typography>
              </Paper>

              {/* Evidence */}
              {resolveDispute.evidence && (
                <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#1e293b' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Items lỗi:</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {resolveDispute.evidence}
                  </Typography>
                </Paper>
              )}

              {/* Seller reply */}
              <Typography variant="overline" sx={{ fontWeight: 800, color: '#334155' }}>PHẢN HỒI CỦA BẠN *</Typography>
              <TextField
                fullWidth multiline rows={3}
                placeholder="Nhập nội dung phản hồi..."
                value={sellerReply}
                onChange={(e) => setSellerReply(e.target.value)}
                InputProps={{ sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                sx={{ mb: 2 }}
              />

              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

              {/* Resolution buttons */}
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                <Button
                  variant="outlined" startIcon={resolving ? <CircularProgress size={16} /> : <MonetizationOnIcon />}
                  disabled={resolving}
                  onClick={() => handleResolve('REFUND')}
                  sx={{ flex: 1, borderRadius: 2, fontWeight: 700, py: 1.5, borderColor: '#d97706', color: '#d97706', '&:hover': { bgcolor: '#fffbeb', borderColor: '#b45309' } }}
                >
                  Hoàn tiền
                </Button>
                <Button
                  variant="outlined" startIcon={resolving ? <CircularProgress size={16} /> : <BuildIcon />}
                  disabled={resolving}
                  onClick={() => handleResolve('WARRANTY')}
                  sx={{ flex: 1, borderRadius: 2, fontWeight: 700, py: 1.5, borderColor: '#2563eb', color: '#2563eb', '&:hover': { bgcolor: '#eff6ff', borderColor: '#1d4ed8' } }}
                >
                  Bảo hành
                </Button>
                <Button
                  variant="outlined" startIcon={resolving ? <CircularProgress size={16} /> : <ForumIcon />}
                  disabled={resolving}
                  onClick={() => handleResolve('DISPUTE')}
                  sx={{ flex: 1, borderRadius: 2, fontWeight: 700, py: 1.5, borderColor: '#dc2626', color: '#dc2626', '&:hover': { bgcolor: '#fef2f2', borderColor: '#b91c1c' } }}
                >
                  Tranh chấp
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResolveDispute(null)} sx={{ fontWeight: 600, borderRadius: 2 }}>Hủy</Button>
        </DialogActions>
      </Dialog>
    </SellerLayout>
  );
}
