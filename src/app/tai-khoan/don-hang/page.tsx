'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Paper, Typography, Button, Chip, Alert,
  TextField, InputAdornment, alpha, Grid, Divider, Select, MenuItem, FormControl,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, IconButton
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '@/context/AuthContext';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  HOLDING:   { label: 'Tạm giữ',    color: '#d97706', bg: '#fef3c7' },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  DISPUTED:  { label: 'Khiếu nại',  color: '#dc2626', bg: '#fee2e2' },
  PENDING:   { label: 'Đang xử lý', color: '#64748b', bg: '#f1f5f9' },
};

interface Order {
  id: string;
  quantity: number;
  amount: number;
  fee: number;
  status: string;
  deliveredContent: string | null;
  warrantyExpire: Date | null;
  createdAt: Date;
  variantName?: string | null;
  product?: {
    title: string;
    slug: string;
    type: string;
    thumbnail: string | null;
  };
  seller?: {
    username: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  // Dialog State
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // Dispute Dialog
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [disputeFaultyCount, setDisputeFaultyCount] = useState(1);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchOrders = () => {
    fetch(`/api/me/orders?userId=${user?.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); });
  };

  useEffect(() => {
    if (!localStorage.getItem('mmo_user')) { router.push('/dang-nhap'); return; }
    if (user?.id) fetchOrders();
  }, [router, user?.id]);

  const handleConfirm = async (orderId: string) => {
    if (!user || !confirm('Xác nhận bạn đã kiểm tra và nhận đủ tài khoản?\nTiền sẽ được cộng cho người bán ngay lập tức!')) return;
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || 'Lỗi');
      else {
        toast.success('Xác nhận nhận hàng thành công!');
        fetchOrders();
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDownload = (content: string, orderId: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `don-hang-${orderId.slice(0, 8)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.product?.title?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <SiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReceiptLongIcon sx={{ fontSize: 36, opacity: 0.9 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Đơn Hàng Đã Mua</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Quản lý và theo dõi lịch sử mua tài nguyên của bạn</Typography>
          </Box>
          {!loading && <Chip label={`${orders.length} đơn`} sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}
        </Box>

        {/* Escrow info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { icon: <AccessTimeIcon sx={{ fontSize: 20, color: '#d97706' }} />, title: 'Tạm giữ', desc: 'Tiền đang được MarketMMO giữ 3 ngày để bảo mật quyền lợi cho bạn.', bg: '#fefce8', border: '#fde68a' },
            { icon: <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#16a34a' }} />, title: 'Hoàn thành', desc: 'Sau 3 ngày tiền đã được chuyển cho người bán.', bg: '#f0fdf4', border: '#bbf7d0' },
            { icon: <WarningAmberIcon sx={{ fontSize: 20, color: '#dc2626' }} />, title: 'Khiếu nại', desc: 'Đơn hàng được treo tiền để chờ bạn và người bán giải quyết sự cố.', bg: '#fff1f2', border: '#fecdd3' },
            { icon: <InfoOutlinedIcon sx={{ fontSize: 20, color: '#0284c7' }} />, title: 'Lưu ý', desc: 'Bên mình chỉ giữ tiền 3 ngày. Không có khiếu nại, tiền tự chuyển cho người bán.', bg: '#f0f9ff', border: '#bae6fd' },
          ].map((item, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: item.bg, border: '1px solid', borderColor: item.border, display: 'flex', gap: 1.5 }}>
                <Box sx={{ flexShrink: 0, mt: 0.2 }}>{item.icon}</Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>- {item.title}:</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '0.78rem' }}>{item.desc}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2, fontSize: '0.82rem' }}>
          Trong trường hợp chủ shop không giải quyết hoặc giải quyết không thỏa đáng, hãy bấm{' '}
          <strong>&quot;Khiếu nại đơn hàng&quot;</strong>, để bên mình có thể giữ tiền đơn hàng đó trong lúc bạn đợi phản hồi từ người bán.
        </Alert>

        {/* Search & Filter */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField placeholder="Nhập mã đơn, tên SP..." value={search} onChange={(e) => setSearch(e.target.value)} size="small"
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                <MenuItem value="HOLDING">Tạm giữ</MenuItem>
                <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                <MenuItem value="DISPUTED">Khiếu nại</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Orders list */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={100} />)}
          </Box>
        ) : filtered.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider', bgcolor: 'white' }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              {search || statusFilter !== 'all' ? 'Không tìm thấy đơn hàng phù hợp' : 'Bạn chưa có đơn hàng nào'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Khám phá hàng nghìn sản phẩm số và dịch vụ chất lượng trên MarketMMO
            </Typography>
            <Button variant="contained" href="/" size="large" sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
              Mua sắm ngay
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((order) => {
              const st = statusMap[order.status] ?? { label: order.status, color: '#64748b', bg: '#f1f5f9' };
              return (
                <Paper key={order.id} elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: '#16a34a' }, transition: 'border-color 0.2s' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, color: '#1e293b' }}>
                        {order.product?.title ?? 'Gian hàng'} {order.variantName && order.variantName !== 'Kho chung' ? ` - ${order.variantName}` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Mã đơn: #{order.id.slice(0, 8)} · Người bán: @{order.seller?.username ?? 'n/a'} · {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.72rem', mb: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', display: 'block' }}>
                        {order.amount.toLocaleString('vi-VN')} VNĐ
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Order Actions & Content Snippet */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {order.status === 'HOLDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={confirmingId === order.id}
                          onClick={() => handleConfirm(order.id)}
                          sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {confirmingId === order.id ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
                        </Button>
                      )}
                      {(order.status === 'HOLDING' || order.status === 'COMPLETED') && (
                        <Button size="small" variant="outlined" color="error" onClick={() => { setDisputeOrder(order); setDisputeReason(''); setDisputeEvidence(''); setDisputeFaultyCount(1); }} sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}>Khiếu nại</Button>
                      )}
                      {order.status === 'DISPUTED' && (
                        <Chip label="Đang khiếu nại" size="small" sx={{ fontWeight: 600, bgcolor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }} />
                      )}
                    </Box>
                    
                    {order.deliveredContent && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => setViewOrder(order)}
                        sx={{ borderRadius: 2, fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Nội dung đã giao
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        <Alert severity="error" variant="outlined" icon={<WarningAmberIcon />} sx={{ mt: 3, borderRadius: 2, fontSize: '0.8rem' }}>
          ⚠️ Cấm tuyệt đối dùng tài khoản mua từ web vào mục đích vi phạm pháp luật. Nếu vi phạm, bạn phải chịu trách nhiệm hoàn toàn!
        </Alert>
      </Container>
      
      {/* View Delivery Dialog */}
      <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chi tiết nội dung giao hàng
          {viewOrder?.deliveredContent && (
            <Button
              size="small"
              variant="contained"
              color="success"
              disableElevation
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(viewOrder.deliveredContent, viewOrder.id)}
              sx={{ borderRadius: 2 }}
            >
              Tải TXT
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8fafc', p: 2 }}>
          {viewOrder && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewOrder.product?.title}</Typography>
              <Typography variant="caption" color="text.secondary">Mã đơn: #{viewOrder.id}</Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {viewOrder.deliveredContent}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setViewOrder(null)} sx={{ borderRadius: 2, fontWeight: 600 }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dispute dialog */}
      <Dialog open={!!disputeOrder} onClose={() => setDisputeOrder(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Gửi Khiếu Nại
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Đơn hàng: <strong>{disputeOrder?.id?.slice(-8).toUpperCase()}</strong>
            <br />
            Sản phẩm: {disputeOrder?.product?.title} {disputeOrder?.variantName && disputeOrder.variantName !== 'Kho chung' ? `- ${disputeOrder.variantName}` : ''}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            fullWidth multiline rows={3}
            label="Mô tả vấn đề *"
            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với đơn hàng này..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            fullWidth multiline rows={4}
            label="Dán nội dung lỗi (nếu có)"
            placeholder="Dán các tài khoản/nội dung bị lỗi vào đây, mỗi dòng 1 item..."
            value={disputeEvidence}
            onChange={(e) => setDisputeEvidence(e.target.value)}
            InputProps={{ sx: { borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
          <TextField
            type="number" label="Số lượng items lỗi"
            value={disputeFaultyCount}
            onChange={(e) => setDisputeFaultyCount(Math.max(1, parseInt(e.target.value) || 1))}
            InputProps={{ sx: { borderRadius: 2 }, inputProps: { min: 1, max: disputeOrder?.quantity || 999 } }}
            sx={{ maxWidth: 200 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDisputeOrder(null)} color="inherit" sx={{ fontWeight: 600 }}>Hủy</Button>
          <Button
            variant="contained" color="error" disableElevation
            disabled={!disputeReason.trim() || submittingDispute}
            onClick={async () => {
              if (!user || !disputeOrder) return;
              setSubmittingDispute(true);
              try {
                const res = await fetch('/api/disputes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: disputeOrder.id,
                    buyerId: user.id,
                    reason: disputeReason,
                    evidence: disputeEvidence,
                    faultyCount: disputeFaultyCount,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  setDisputeOrder(null);
                  fetchOrders();
                  toast.success('Khiếu nại đã được gửi thành công!');
                } else {
                  toast.error(data.error || 'Lỗi gửi khiếu nại');
                }
              } catch {
                toast.error('Lỗi kết nối');
              } finally {
                setSubmittingDispute(false);
              }
            }}
            sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {submittingDispute ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </Button>
        </DialogActions>
      </Dialog>
    </SiteLayout>
  );
}

