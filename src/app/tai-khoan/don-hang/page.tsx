'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Paper, Typography, Button, Chip, Alert,
  TextField, InputAdornment, Grid, Select, MenuItem, FormControl,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Rating
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import ForumIcon from '@mui/icons-material/Forum';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import QuickChatDialog from '@/components/chat/QuickChatDialog';
import { useSocket } from '@/context/SocketContext';


const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  HOLDING:   { label: 'Tạm giữ',    color: '#d97706', bg: '#fef3c7' },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  DISPUTED:  { label: 'Khiếu nại',  color: '#dc2626', bg: '#fee2e2' },
  PENDING:   { label: 'Đang xử lý', color: '#64748b', bg: '#f1f5f9' },
  REFUNDED:  { label: 'Đã hoàn tiền', color: '#7c3aed', bg: '#f5f3ff' },
  PRE_ORDER: { label: 'Đặt trước',  color: '#0284c7', bg: '#e0f2fe' },
  CANCELLED: { label: 'Đã huỷ',     color: '#94a3b8', bg: '#f1f5f9' },
  NEGOTIATING: { label: 'Thương lượng', color: '#f59e0b', bg: '#fef3c7' },
  PENDING_ACCEPTANCE: { label: 'Chờ NB xác nhận', color: '#0ea5e9', bg: '#e0f2fe' },
  IN_PROGRESS: { label: 'Đang làm', color: '#7c3aed', bg: '#f5f3ff' },
  DELIVERED: { label: 'Đã bàn giao', color: '#10b981', bg: '#dcfce7' },
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
  customPrice: number | null;
  negotiatedDeliveryHours: number | null;
  pendingExtensionHours: number | null;
  startedAt: string | null;
  deliveredAt: string | null;
  variantName: string | null;
  product: { id: string; title: string; thumbnail: string; isService: boolean; deliveryTimeHours: number | null };
  variant: { id: string; name: string; price: number; deliveryTimeHours: number | null } | null;
  seller?: {
    id: string;
    username: string;
  };
  dispute?: {
    id: string;
    status: string;
  };
  review?: {
    rating: number;
    comment: string | null;
  } | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingPreOrderId, setCancellingPreOrderId] = useState<string | null>(null);
  const [cancellingServiceOrderId, setCancellingServiceOrderId] = useState<string | null>(null);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  // Review State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Quick Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [targetChatUser, setTargetChatUser] = useState<{ id: string; username: string; avatar?: string | null } | null>(null);

  const handleOpenChat = (seller: { id: string; username: string }) => {
    if (!seller?.id) return;
    setTargetChatUser({ id: seller.id, username: seller.username, avatar: null });
    setChatOpen(true);
  };

  // Global Confirm State
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'success' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info'
  });

  const fetchOrders = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/me/orders?userId=${user.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); });
  }, [user?.id]);


  const handleExtensionAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/approve-extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: user.id, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'APPROVE' ? 'Đã chấp nhận gia hạn' : 'Đã từ chối gia hạn');
        fetchOrders();
      } else toast.error(data.error);
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const handleConfirm = useCallback(async (orderId: string, isService = false) => {
    if (!user) return;
    setConfirmState({
      open: true,
      title: 'Xác nhận hoàn thành',
      message: isService 
        ? 'Xác nhận người bán đã hoàn thành yêu cầu và bàn giao nội dung cho bạn? Tiền sẽ được giải ngân cho người bán ngay lập tức!'
        : 'Xác nhận bạn đã kiểm tra và nhận đủ tài khoản? Tiền sẽ được cộng cho người bán ngay lập tức!',
      variant: 'success',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
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
            toast.success('Xác nhận thành công!');
            fetchOrders();
            refreshUser(); // Update balance immediately
          }
        } catch {
          toast.error('Network error');
        } finally {
          setConfirmingId(null);
        }
      }
    });
  }, [user, fetchOrders, refreshUser]);

  const handleAcceptBid = useCallback(async (orderId: string, price: number) => {
    if (!user) return;
    setConfirmState({
      open: true,
      title: 'Chấp nhận báo giá',
      message: `Bạn đồng ý với báo giá ${price.toLocaleString('vi-VN')}đ từ người bán? Số tiền này sẽ được trừ từ số dư của bạn và tạm giữ an toàn bởi MarketMMO.`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        setAcceptingBidId(orderId);
        try {
          const res = await fetch(`/api/orders/${orderId}/accept-bid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buyerId: user.id }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success('Đã chấp nhận báo giá và thanh toán thành công!');
            fetchOrders();
          } else {
            toast.error(data.error || 'Lỗi khi chấp nhận báo giá');
          }
        } catch {
          toast.error('Lỗi kết nối');
        } finally {
          setAcceptingBidId(null);
        }
      }
    });
  }, [user, fetchOrders]);

  const handleDownload = (content: string, orderId: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `don-hang-${orderId.slice(-8).toUpperCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCancelDispute = useCallback(async (orderId: string) => {
    if (!user) return;
    setConfirmState({
      open: true,
      title: 'Hủy khiếu nại',
      message: 'Bạn có chắc chắn muốn huỷ khiếu nại này không? Đơn hàng sẽ trở lại trạng thái bình thường.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        setCancellingId(orderId);
        try {
          const res = await fetch(`/api/disputes/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buyerId: user.id }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success('Đã huỷ khiếu nại thành công!');
            fetchOrders();
          } else {
            toast.error(data.error || 'Lỗi khi huỷ');
          }
        } catch {
          toast.error('Lỗi kết nối');
        } finally {
          setCancellingId(null);
        }
      }
    });
  }, [user, fetchOrders]);

  const handleCancelServiceOrder = useCallback(async (orderId: string, isOverdue = false) => {
    if (!user) return;
    setConfirmState({
      open: true,
      title: isOverdue ? 'Huỷ đơn quá hạn' : 'Huỷ yêu cầu dịch vụ',
      message: isOverdue 
        ? 'Đơn hàng này đã quá thời gian cam kết. Bạn có muốn huỷ đơn và nhận lại tiền ngay lập tức không?'
        : 'Người bán chưa xác nhận đơn hàng này. Bạn có muốn huỷ yêu cầu và nhận lại tiền không?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        setCancellingServiceOrderId(orderId);
        try {
          const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, role: 'BUYER' }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success('Đã huỷ đơn hàng và hoàn tiền thành công!');
            fetchOrders();
            refreshUser();
          } else {
            toast.error(data.error || 'Lỗi khi huỷ đơn');
          }
        } catch {
          toast.error('Lỗi kết nối');
        } finally {
          setCancellingServiceOrderId(null);
        }
      }
    });
  }, [user, fetchOrders, refreshUser]);

  // 1. Initial fetch
  useEffect(() => {
    if (!localStorage.getItem('mmo_user')) { router.push('/dang-nhap'); return; }
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Polling as fallback
    return () => clearInterval(interval);
  }, [fetchOrders, router]);

  // 2. Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data: { orderId?: string; status?: string }) => {
      console.log('Real-time order update (buyer) received:', data);
      fetchOrders(); // Refresh order list
      refreshUser(); // Refresh balance too if needed
    };

    socket.on('order:update', handleOrderUpdate);
    return () => {
      socket.off('order:update', handleOrderUpdate);
    };
  }, [socket, fetchOrders, refreshUser]);

  // 2. Deep-linking logic
  useEffect(() => {
    if (orders.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    const openDispute = urlParams.get('openDispute') === 'true';
    const cancelDispute = urlParams.get('cancelDispute') === 'true';
    
    if (q) {
      setSearch(q);
      const order = orders.find(o => 
        o.id.toLowerCase().includes(q.toLowerCase()) || 
        o.product?.title?.toLowerCase().includes(q.toLowerCase()) ||
        (o.dispute && o.dispute.id.toLowerCase().includes(q.toLowerCase()))
      );
      if (order) {
        if (openDispute && (order.status === 'HOLDING' || order.status === 'COMPLETED') && disputeOrder?.id !== order.id) {
          setDisputeOrder(order);
        } else if (cancelDispute && order.status === 'DISPUTED' && cancellingId !== order.id) {
          handleCancelDispute(order.id);
        }
      }
    }
  }, [orders, disputeOrder?.id, cancellingId, handleCancelDispute]);

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
            <TextField placeholder="Nhập mã đơn, tên SP..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} size="small"
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e: { target: { value: string } }) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                <MenuItem value="PRE_ORDER">Đặt trước</MenuItem>
                <MenuItem value="NEGOTIATING">Thương lượng</MenuItem>
                <MenuItem value="PENDING_ACCEPTANCE">Chờ xác nhận</MenuItem>
                <MenuItem value="IN_PROGRESS">Đang làm</MenuItem>
                <MenuItem value="DELIVERED">Đã bàn giao</MenuItem>
                <MenuItem value="HOLDING">Tạm giữ</MenuItem>
                <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
                <MenuItem value="DISPUTED">Khiếu nại</MenuItem>
                <MenuItem value="CANCELLED">Đã huỷ</MenuItem>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="body1" 
                          onClick={() => router.push(`/tai-khoan/don-hang/${order.id}`)}
                          sx={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer', '&:hover': { color: '#16a34a', textDecoration: 'underline' } }}
                        >
                          {order.product?.title ?? 'Gian hàng'} {order.variantName && order.variantName !== 'Kho chung' ? ` - ${order.variantName}` : ''}
                        </Typography>
                        <Chip size="small" label={order.product?.isService ? 'DỊCH VỤ' : 'SẢN PHẨM SỐ'} color={order.product?.isService ? 'warning' : 'success'} sx={{ borderRadius: 1, fontSize: '0.6rem', fontWeight: 800, height: 20 }} />
                        {order.product?.isService && (
                           <Chip 
                             size="small" 
                             icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />} 
                             label={`GIAO TRONG: ${order.negotiatedDeliveryHours || order.variant?.deliveryTimeHours || order.product?.deliveryTimeHours || 'Thỏa thuật'} GIỜ`} 
                             sx={{ borderRadius: 1, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1', height: 20 }} 
                           />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Mã đơn:{' '}
                        <Box component="span" 
                          onClick={() => router.push(`/tai-khoan/don-hang/${order.id}`)}
                          sx={{ fontWeight: 700, color: '#16a34a', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                          #{order.id.toUpperCase()}
                        </Box>
                        {' '}· Người bán:{' '}
                        <Box component="span" 
                          onClick={(e: React.MouseEvent) => { 
                            e.stopPropagation(); 
                            if (order.seller?.id) {
                              handleOpenChat(order.seller);
                            }
                          }} 
                          sx={{ color: order.seller?.id ? '#2563eb' : 'inherit', cursor: order.seller?.id ? 'pointer' : 'default', textDecoration: order.seller?.id ? 'underline' : 'none', fontWeight: 600 }}
                        >
                          @{order.seller?.username ?? 'n/a'}
                        </Box>
                        {' '}· {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.72rem', mb: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', display: 'block' }}>
                        {order.amount > 0 
                          ? `${order.amount.toLocaleString('vi-VN')} VNĐ` 
                          : (order.customPrice ? `${order.customPrice.toLocaleString('vi-VN')} VNĐ` : 'Thỏa thuận')}
                      </Typography>
                    </Box>
                  </Box>

                  {order.pendingExtensionHours && order.status === 'IN_PROGRESS' && (
                    <Alert 
                      severity="info" 
                      variant="filled" 
                      sx={{ mt: 2, borderRadius: 2, '& .MuiAlert-message': { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        📢 Người bán muốn gia hạn thực hiện thêm <b>{order.pendingExtensionHours} giờ</b>. Bạn đồng ý chứ?
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" color="primary" onClick={() => handleExtensionAction(order.id, 'APPROVE')} sx={{ fontWeight: 700, borderRadius: 1.5 }}>Đồng ý</Button>
                        <Button size="small" variant="contained" color="inherit" onClick={() => handleExtensionAction(order.id, 'REJECT')} sx={{ fontWeight: 700, borderRadius: 1.5, color: '#000' }}>Từ chối</Button>
                      </Box>
                    </Alert>
                  )}
                  
                  {/* Order Actions & Content Snippet */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                      {order.dispute && order.dispute.status === 'ESCALATED' && (
                        <Button size="small" variant="contained" startIcon={<ForumIcon />} onClick={() => router.push(`/tai-khoan/khieu-nai/${order.dispute!.id}`)} sx={{ borderRadius: 1.5, fontSize: '0.75rem', bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}>
                          Phòng tranh chấp
                        </Button>
                      )}
                      {order.status === 'DISPUTED' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip label="Đang khiếu nại" size="small" sx={{ fontWeight: 600, bgcolor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }} />
                          <Button 
                            size="small" variant="text" color="error" 
                            disabled={cancellingId === order.id}
                            onClick={() => handleCancelDispute(order.id)}
                            sx={{ fontSize: '0.7rem', fontWeight: 800, textDecoration: 'underline' }}
                          >
                            {cancellingId === order.id ? 'Đang huỷ...' : 'Huỷ khiếu nại'}
                          </Button>
                        </Box>
                      )}
                      {order.status === 'COMPLETED' && !order.review && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setReviewOrder(order);
                            setReviewRating(5);
                            setReviewComment('');
                          }}
                          sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Đánh giá
                        </Button>
                      )}
                      {order.review && (
                        <Chip 
                          label={`Đã đánh giá: ${order.review.rating}⭐`} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }} 
                        />
                      )}
                      {order.status === 'PRE_ORDER' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip label="Đang chờ hàng" size="small" sx={{ fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }} />
                          <Button 
                            size="small" variant="outlined" color="error" 
                            disabled={cancellingPreOrderId === order.id}
                            onClick={async () => {
                              if (!user) return;
                              setConfirmState({
                                open: true,
                                title: 'Huỷ đặt trước',
                                message: 'Bạn có chắc chắn muốn huỷ đặt trước? Tiền sẽ được hoàn lại cho bạn.',
                                variant: 'danger',
                                onConfirm: async () => {
                                  setConfirmState(prev => ({ ...prev, open: false }));
                                  setCancellingPreOrderId(order.id);
                                  try {
                                    const res = await fetch(`/api/orders/${order.id}/cancel-preorder`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ buyerId: user.id }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      toast.success('Đã huỷ đặt trước và hoàn tiền!');
                                      fetchOrders();
                                    } else {
                                      toast.error(data.error || 'Lỗi khi huỷ');
                                    }
                                  } catch {
                                    toast.error('Lỗi kết nối');
                                  } finally {
                                    setCancellingPreOrderId(null);
                                  }
                                }
                              });
                            }}
                            sx={{ borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 700 }}
                          >
                            {cancellingPreOrderId === order.id ? 'Đang huỷ...' : 'Huỷ đặt trước'}
                          </Button>
                        </Box>
                      )}

                      {order.status === 'NEGOTIATING' && order.customPrice && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          disabled={acceptingBidId === order.id}
                          onClick={() => handleAcceptBid(order.id, order.customPrice!)}
                          sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                        >
                          {acceptingBidId === order.id ? 'Đang xử lý...' : `Chấp nhận báo giá (${order.customPrice?.toLocaleString('vi-VN')}đ)`}
                        </Button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={confirmingId === order.id}
                          onClick={() => handleConfirm(order.id, true)}
                          sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {confirmingId === order.id ? 'Đang xử lý...' : 'Xác nhận hoàn thành'}
                        </Button>
                      )}

                      {order.status === 'IN_PROGRESS' && order.startedAt && (
                        <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 700, bgcolor: '#f5f3ff', px: 1, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14 }} /> ĐANG LÀM
                        </Typography>
                      ) }

                      {order.status === 'PENDING_ACCEPTANCE' && (
                        <Button 
                          size="small" variant="outlined" color="error" 
                          disabled={cancellingServiceOrderId === order.id}
                          onClick={() => handleCancelServiceOrder(order.id)}
                          sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {cancellingServiceOrderId === order.id ? 'Đang huỷ...' : 'Huỷ đơn'}
                        </Button>
                      )}

                      {order.status === 'IN_PROGRESS' && order.startedAt && (() => {
                        const deliveryHours = order.negotiatedDeliveryHours || order.variant?.deliveryTimeHours || order.product?.deliveryTimeHours || 0;
                        const isOverdue = (new Date().getTime() - new Date(order.startedAt).getTime() > deliveryHours * 3600000);
                        if (isOverdue) {
                          return (
                            <Button 
                              size="small" variant="contained" color="error" 
                              disabled={cancellingServiceOrderId === order.id}
                              onClick={() => handleCancelServiceOrder(order.id, true)}
                              sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              {cancellingServiceOrderId === order.id ? 'Đang huỷ...' : 'HUỶ VÌ QUÁ HẠN'}
                            </Button>
                          );
                        }
                        return null;
                      })()}

                      <Button 
                        size="small" variant="outlined" startIcon={<ForumIcon />}
                        onClick={() => order.seller && handleOpenChat(order.seller)}
                        sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Chat với người bán
                      </Button>
                      <Button 
                        size="small" variant="outlined"
                        onClick={() => router.push(`/tai-khoan/don-hang/${order.id}`)}
                        sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}
                      >
                        Xem chi tiết
                      </Button>
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
              onClick={() => handleDownload(viewOrder.deliveredContent || '', viewOrder.id)}
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
            Đơn hàng: <strong>{disputeOrder?.id?.toUpperCase()}</strong>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisputeReason(e.target.value)}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            fullWidth multiline rows={4}
            label="Dán nội dung lỗi (nếu có)"
            placeholder="Dán các tài khoản/nội dung bị lỗi vào đây, mỗi dòng 1 item..."
            value={disputeEvidence}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisputeEvidence(e.target.value)}
            InputProps={{ sx: { borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
          <TextField
            type="number" label="Số lượng items lỗi"
            value={disputeFaultyCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisputeFaultyCount(Math.max(1, parseInt(e.target.value) || 1))}
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

      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        loading={confirmingId !== null || cancellingId !== null}
      />

      {/* Quick Chat Dialog */}
      <QuickChatDialog 
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        targetUser={targetChatUser}
      />

      {/* Review Dialog */}
      <Dialog 
        open={!!reviewOrder} 
        onClose={() => !submittingReview && setReviewOrder(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Đánh giá sản phẩm</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Bạn thấy sản phẩm <b>{reviewOrder?.product?.title}</b> thế nào?
          </Typography>
          <Rating
            size="large"
            value={reviewRating}
            onChange={(_, val) => setReviewRating(val || 5)}
            sx={{ color: '#f59e0b', fontSize: '3rem' }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Nhận xét của bạn"
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setReviewOrder(null)} disabled={submittingReview} color="inherit">Hủy</Button>
          <Button
            variant="contained"
            disabled={submittingReview}
            onClick={async () => {
              if (!reviewOrder || !user) return;
              setSubmittingReview(true);
              try {
                const res = await fetch('/api/reviews', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: reviewOrder.id,
                    productId: reviewOrder.product?.id,
                    rating: reviewRating,
                    comment: reviewComment
                  })
                });
                const data = await res.json();
                if (data.success) {
                  toast.success('Cảm ơn bạn đã đánh giá!');
                  setReviewOrder(null);
                  fetchOrders();
                } else {
                  toast.error(data.error || 'Lỗi khi gửi đánh giá');
                }
              } catch {
                toast.error('Lỗi kết nối');
              } finally {
                setSubmittingReview(false);
              }
            }}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>
    </SiteLayout>
  );
}
