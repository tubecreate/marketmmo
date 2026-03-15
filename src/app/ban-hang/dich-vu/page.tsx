'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SellerLayout from '@/components/layout/SellerLayout';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Button, Chip, Skeleton, Tooltip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material';
import HandymanIcon from '@mui/icons-material/Handyman';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatIcon from '@mui/icons-material/Chat';
import UpdateIcon from '@mui/icons-material/Update';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import QuickChatDialog from '@/components/chat/QuickChatDialog';
import { useSocket } from '@/context/SocketContext';

interface Order {
  id: string;
  status: string;
  amount: number;
  customPrice: number | null;
  negotiatedDeliveryHours: number | null;
  pendingExtensionHours: number | null;
  startedAt: string | null;
  deliveredAt: string | null;
  deliveredContent: string | null;
  createdAt: string;
  product: {
    title: string;
    thumbnail: string | null;
    isService: boolean;
    deliveryTimeHours: number | null;
  };
  variant: {
    name: string;
    price: number;
    deliveryTimeHours: number | null;
  } | null;
  buyer: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
}

const STATUS_TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Thương lượng', value: 'NEGOTIATING' },
  { label: 'Chờ xác nhận', value: 'PENDING_ACCEPTANCE' },
  { label: 'Đang làm', value: 'IN_PROGRESS' },
  { label: 'Đã bàn giao', value: 'DELIVERED' },
  { label: 'Tạm giữ', value: 'HOLDING' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Khiếu nại', value: 'DISPUTED' },
  { label: 'Đã hoàn tiền', value: 'REFUNDED' },
];

const CountdownTimer = ({ startedAt, durationHours }: { startedAt: string; durationHours: number }) => {
  const calculateInitialTime = () => {
    const start = new Date(startedAt).getTime();
    const end = start + durationHours * 60 * 60 * 1000;
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return 'Quá hạn';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };
  const [timeLeft, setTimeLeft] = useState<string>(calculateInitialTime());

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startedAt).getTime();
      const end = start + durationHours * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) return 'Quá hạn';

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = h < 10 ? `0${h}` : h;
      const mStr = m < 10 ? `0${m}` : m;
      const sStr = s < 10 ? `0${s}` : s;

      return `${hStr}:${mStr}:${sStr}`;
    };

    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(timer);
  }, [startedAt, durationHours]);

  const isLate = timeLeft === 'Quá hạn';

  return (
    <Typography variant="body2" sx={{ fontWeight: 700, color: isLate ? '#dc2626' : '#16a34a', fontFamily: 'monospace' }}>
      {timeLeft}
    </Typography>
  );
};

export default function SellerServiceOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Quick Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [targetChatUser, setTargetChatUser] = useState<any>(null);

  const [bidPrice, setBidPrice] = useState('');
  const [bidDeliveryHours, setBidDeliveryHours] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [deliveryContent, setDeliveryContent] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Extend Logic
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendHours, setExtendHours] = useState('24');
  const [extendingOrder, setExtendingOrder] = useState<Order | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    color?: 'primary' | 'secondary' | 'warning' | 'error' | 'success';
  }>({ title: '', message: '', onConfirm: () => {} });

  const handleOpenConfirm = (title: string, message: string, onConfirm: () => void, color: any = 'primary') => {
    setConfirmConfig({ title, message, onConfirm, color });
    setConfirmOpen(true);
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const stored = localStorage.getItem('mmo_user');
      const localUser = stored ? JSON.parse(stored) : null;
      const uid = user?.id || localUser?.id;
      if (!uid) return;

      const res = await fetch(`/api/me/seller-orders?userId=${uid}&status=${tabValue}`);
      const data = await res.json();
      const allOrders = Array.isArray(data) ? data : [];
      
      // EXCLUSIVELY Service Orders in this page
      const serviceOrders = allOrders.filter((o: any) => !!o.product?.isService && o.status !== 'PRE_ORDER');
      setOrders(serviceOrders);
    } catch (err) {
      console.error('Fetch service orders error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id, tabValue]);

  // Sync selected order data when orders list updates
  useEffect(() => {
    if (detailOpen && selectedOrder && orders.length > 0) {
      const newest = orders.find((o) => o.id === selectedOrder.id);
      if (newest && JSON.stringify(newest) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(newest);
      }
    }
  }, [orders, detailOpen, selectedOrder]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    
    const handleOrderUpdate = (data: any) => {
      console.log('Real-time order update received:', data);
      fetchOrders(true); // Silent refresh
    };

    socket.on('order:update', handleOrderUpdate);
    return () => {
      socket.off('order:update', handleOrderUpdate);
    };
  }, [socket, fetchOrders]);

  const handleBid = async () => {
    if (!selectedOrder || !bidPrice || !bidDeliveryHours) return;
    setBidLoading(true);
    const toastId = toast.loading('Đang gửi báo giá...');
    const target = selectedOrder;
    if (!target) return;
    try {
      const res = await fetch(`/api/orders/${target.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellerId: user?.id, 
          price: bidPrice,
          deliveryHours: bidDeliveryHours
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã gửi báo giá thành công!', { id: toastId });
        setBidPrice('');
        setBidDeliveryHours('');
        setDetailOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error, { id: toastId });
      }
    } finally { setBidLoading(false); }
  };

  const handleAcceptService = async (order?: Order) => {
    const target = order || selectedOrder;
    if (!target) return;
    
    if (order) setProcessingOrderId(order.id);
    else setActionLoading(true);
    
    const toastId = toast.loading('Đang xử lý...');
    try {
      const res = await fetch(`/api/orders/${target.id}/accept-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xác nhận thực hiện đơn hàng!', { id: toastId });
        setDetailOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error, { id: toastId });
      }
    } finally { 
      if (order) setProcessingOrderId(null);
      else setActionLoading(false); 
    }
  };

  const handleDeliver = async () => {
    if (!selectedOrder || !deliveryContent) return;
    setActionLoading(true);
    const toastId = toast.loading('Đang bàn giao...');
    const target = selectedOrder;
    if (!target) return;
    try {
      const res = await fetch(`/api/orders/${target.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user?.id, content: deliveryContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã bàn giao đơn hàng thành công!', { id: toastId });
        setDeliveryContent('');
        setDetailOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error, { id: toastId });
      }
    } finally { setActionLoading(false); }
  };

  const handleCancelOrder = async (order?: Order) => {
    const target = order || selectedOrder;
    if (!target) return;
    
    setProcessingOrderId(target.id);
    const toastId = toast.loading('Đang xử lý huỷ đơn...');
    try {
      const res = await fetch(`/api/orders/${target.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, role: 'SELLER' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã huỷ đơn hàng và hoàn tiền thành công!', { id: toastId });
        setDetailOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error, { id: toastId });
      }
    } finally { setProcessingOrderId(null); }
  };

  const handleExtend = async () => {
    if (!extendingOrder || !extendHours) return;
    setExtendLoading(true);
    try {
      const res = await fetch(`/api/orders/${extendingOrder.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user?.id, hours: extendHours }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã gia hạn thêm ${extendHours} giờ!`);
        setExtendOpen(false);
        setDetailOpen(false);
        fetchOrders();
      } else toast.error(data.error);
    } catch (err) {
      toast.error('Lỗi kết nối');
    } finally { setExtendLoading(false); }
  };

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('mmo_user');
      if (!stored) {
        router.push('/dang-nhap');
        return;
      }
    }
    fetchOrders();
  }, [user, tabValue, router, fetchOrders]);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.product?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.buyer?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'HOLDING': return <Chip label="Tạm giữ tiền" size="small" sx={{ fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'COMPLETED': return <Chip label="Hoàn thành" size="small" sx={{ fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'DISPUTED': return <Chip label="Khiếu nại" size="small" sx={{ fontWeight: 600, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'NEGOTIATING': return <Chip label="Thương lượng" size="small" sx={{ fontWeight: 600, bgcolor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'PENDING_ACCEPTANCE': return <Chip label="Chờ bạn xác nhận" size="small" sx={{ fontWeight: 600, bgcolor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'IN_PROGRESS': return <Chip label="Đang thực hiện" size="small" sx={{ fontWeight: 600, bgcolor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'DELIVERED': return <Chip label="Đã bàn giao" size="small" sx={{ fontWeight: 600, bgcolor: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', fontSize: '0.7rem', borderRadius: 1 }} />;
      default: return <Chip label={status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setBidPrice(String(order.customPrice || order.variant?.price || ''));
    setBidDeliveryHours(String(order.negotiatedDeliveryHours || order.variant?.deliveryTimeHours || order.product.deliveryTimeHours || ''));
    setDetailOpen(true);
  };

  const isPendingExtension = selectedOrder?.pendingExtensionHours != null;

  const handleOpenChat = (order: Order) => {
    if (!order.buyer) {
      toast.error('Không tìm thấy thông tin người mua');
      return;
    }
    setTargetChatUser(order.buyer);
    setChatOpen(true);
  };

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ bgcolor: '#16a34a', p: 3.5, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, color: 'white' }}>Quản lý Đơn Dịch Vụ</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              Danh sách các đơn hàng dịch vụ bạn đang thực hiện cho khách hàng.
            </Typography>
          </Box>
          <HandymanIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 60 }} />
        </Box>

        <Paper elevation={0} sx={{ p: 0, borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', bgcolor: 'white', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, v) => setTabValue(v)}
              sx={{
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.85rem', minHeight: 60 },
                '& .Mui-selected': { color: '#16a34a !important' },
                '& .MuiTabs-indicator': { bgcolor: '#16a34a', height: 3 }
              }}
            >
              {STATUS_TABS.map(tab => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth placeholder="Tìm theo Mã đơn, Tên dịch vụ hoặc Tên người mua..."
              size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>ĐƠN HÀNG</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>GIÁ</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>TRẠNG THÁI</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>THỜI GIAN CÒN LẠI</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>NGÀY ĐẶT</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }} align="right">THAO TÁC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>)
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Không tìm thấy đơn hàng nào.</TableCell></TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {order.status === 'PRE_ORDER' && (
                            <Chip label="ĐẶT TRƯỚC" size="small" color="warning" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, borderRadius: 0.5 }} />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.product?.title}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>ID: {order.id.split('-')[0]}... · Khách: {order.buyer?.username}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16a34a' }}>
                          {order.amount > 0 ? `${order.amount.toLocaleString('vi-VN')}đ` : (order.customPrice ? `${order.customPrice.toLocaleString('vi-VN')}đ` : 'Chờ báo giá')}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(order.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          { (order.status === 'IN_PROGRESS' || order.status === 'DELIVERED') && order.startedAt ? (
                            <CountdownTimer startedAt={order.startedAt} durationHours={order.negotiatedDeliveryHours || order.variant?.deliveryTimeHours || order.product.deliveryTimeHours || 0} />
                          ) : '---'}
                          
                          {order.status === 'IN_PROGRESS' && (
                            <Tooltip title="Gia hạn thêm thời gian">
                              <IconButton 
                                size="small" 
                                color="info" 
                                onClick={() => { setExtendingOrder(order); setExtendOpen(true); }}
                                sx={{ p: 0.5, border: '1px solid #e0f2fe', bgcolor: '#f0f9ff' }}
                              >
                                <UpdateIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button 
                            variant="outlined" size="small" 
                            startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleViewDetail(order)} 
                            sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, py: 0.5 }}
                          >
                            Chi tiết
                          </Button>

                          <Button 
                            variant="outlined" size="small" color="info"
                            startIcon={<ChatIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenChat(order)} 
                            sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, py: 0.5 }}
                          >
                            Chat
                          </Button>

                          {order.status === 'NEGOTIATING' && (
                            <Button 
                              variant="contained" size="small" color="warning" disableElevation
                              onClick={() => handleViewDetail(order)}
                              sx={{ fontSize: '0.65rem', py: 0.5, px: 1, fontWeight: 800, minWidth: 'fit-content', borderRadius: 1.5 }}
                            >
                              BÁO GIÁ
                            </Button>
                          )}

                          {order.status === 'PENDING_ACCEPTANCE' && (
                            <Button 
                              variant="contained" size="small" color="primary" disableElevation
                              onClick={() => handleOpenConfirm(
                                'Xác nhận thực hiện',
                                'Bạn có chắc chắn muốn bắt đầu thực hiện đơn hàng này? Thời gian hoàn thành sẽ bắt đầu đếm ngược ngay bây giờ.',
                                () => handleAcceptService(order)
                              )}
                              disabled={processingOrderId === order.id}
                              sx={{ fontSize: '0.65rem', py: 0.5, px: 1, fontWeight: 800, minWidth: 'fit-content', borderRadius: 1.5 }}
                            >
                              {processingOrderId === order.id ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
                            </Button>
                          )}

                          {order.status === 'IN_PROGRESS' && (
                            <Button 
                              variant="contained" size="small" color="secondary" disableElevation
                              onClick={() => handleOpenConfirm(
                                'Xác nhận bàn giao',
                                'Bạn đã chuẩn bị sẵn nội dung bàn giao chưa? Nhấn Đồng ý để mở khung nhập nội dung và bàn giao cho khách.',
                                () => handleViewDetail(order),
                                'secondary'
                              )}
                              sx={{ fontSize: '0.65rem', py: 0.5, px: 1, fontWeight: 800, minWidth: 'fit-content', borderRadius: 1.5, bgcolor: '#7c3aed' }}
                            >
                              BÀN GIAO
                            </Button>
                          )}

                          {order.status === 'IN_PROGRESS' && (
                            <Button 
                              variant="contained" size="small" color="error" disableElevation
                              onClick={() => handleOpenConfirm(
                                'Xác nhận huỷ đơn',
                                'Bạn có chắc chắn muốn huỷ đơn hàng này? Tiền sẽ được hoàn trả lại cho khách hàng và bạn sẽ không nhận được thanh toán.',
                                () => handleCancelOrder(order),
                                'error'
                              )}
                              disabled={processingOrderId === order.id}
                              sx={{ fontSize: '0.65rem', py: 0.5, px: 1, fontWeight: 800, minWidth: 'fit-content', borderRadius: 1.5 }}
                            >
                              HUỶ ĐƠN
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          {selectedOrder && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Chi tiết Đơn Dịch Vụ</Typography>
                {getStatusChip(selectedOrder.status)}
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Dịch vụ</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedOrder.product?.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Khách hàng: <strong>@{selectedOrder.buyer?.username}</strong></Typography>
                </Box>
                
                <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Thanh toán</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16a34a' }}>
                      {selectedOrder.amount > 0 
                        ? `${selectedOrder.amount.toLocaleString('vi-VN')}đ` 
                        : (selectedOrder.customPrice ? `${selectedOrder.customPrice.toLocaleString('vi-VN')}đ` : 'Chờ báo giá')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Thời hạn hoàn thành</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
                      {selectedOrder.negotiatedDeliveryHours 
                        ? `${selectedOrder.negotiatedDeliveryHours}h` 
                        : `${selectedOrder.variant?.deliveryTimeHours || selectedOrder.product.deliveryTimeHours || 0}h`}
                    </Typography>
                  </Box>
                </Stack>

                {selectedOrder.status === 'DELIVERED' && (
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>NỘI DUNG ĐÃ BÀN GIAO</Typography>
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{selectedOrder.deliveredContent}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
                {selectedOrder?.status === 'NEGOTIATING' && (
                  <Box sx={{ width: '100%', mb: 1, p: 2, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fef3c7' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 2, color: '#854d0e' }}>BÁO GIÁ CHO KHÁCH HÀNG</Typography>
                    <Stack spacing={2} sx={{ mb: 2 }}>
                      <TextField
                        fullWidth size="small" label="Giá báo (VNĐ)"
                        type="number"
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                        placeholder="VD: 500000"
                        sx={{ bgcolor: 'white' }}
                        InputProps={{ sx: { borderRadius: 1.5 } }}
                      />
                      <TextField
                        fullWidth size="small" label="Thời gian thực hiện (giờ)"
                        type="number"
                        value={bidDeliveryHours}
                        onChange={(e) => setBidDeliveryHours(e.target.value)}
                        placeholder="VD: 48"
                        sx={{ bgcolor: 'white' }}
                        InputProps={{ 
                          sx: { borderRadius: 1.5 },
                          endAdornment: <InputAdornment position="end">giờ</InputAdornment>
                        }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
                      * Khách hàng sẽ thấy báo giá này và thời gian cam kết của bạn.
                    </Typography>
                    <Button 
                      fullWidth variant="contained" color="warning" 
                      onClick={handleBid} 
                      disabled={bidLoading || !bidPrice || !bidDeliveryHours} 
                      sx={{ fontWeight: 800, borderRadius: 1.5 }}
                    >
                      {bidLoading ? 'ĐANG GỬI...' : 'GỬI BÁO GIÁ'}
                    </Button>
                  </Box>
                )}

                {selectedOrder?.status === 'PENDING_ACCEPTANCE' && (
                  <Button fullWidth variant="contained" color="primary" onClick={() => handleAcceptService()} disabled={actionLoading} sx={{ fontWeight: 800, py: 1.5 }}>
                    {actionLoading ? 'ĐANG XỬ LÝ...' : 'BẮT ĐẦU THỰC HIỆN'}
                  </Button>
                )}

                {selectedOrder?.status === 'IN_PROGRESS' && (
                  <Box sx={{ width: '100%', mb: 1, p: 2, bgcolor: '#f5f3ff', borderRadius: 2, border: '1px solid #ddd6fe' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: '#5b21b6' }}>BÀN GIAO SẢN PHẨM</Typography>
                    <TextField
                      fullWidth multiline rows={4} label="Nội dung/Link bàn giao"
                      placeholder="Nhập tài liệu hoặc link bàn giao..."
                      value={deliveryContent} onChange={(e) => setDeliveryContent(e.target.value)}
                      sx={{ mb: 1.5, bgcolor: 'white' }}
                    />
                    <Button fullWidth variant="contained" color="secondary" onClick={handleDeliver} disabled={actionLoading || !deliveryContent} sx={{ fontWeight: 800, bgcolor: '#7c3aed' }}>
                      {actionLoading ? 'ĐANG GỬI...' : 'XÁC NHẬN BÀN GIAO'}
                    </Button>
                  </Box>
                )}
                {selectedOrder?.status === 'IN_PROGRESS' && (
                  <Button 
                    fullWidth variant="outlined" color="error" 
                    onClick={() => handleOpenConfirm(
                      'Xác nhận huỷ đơn',
                      'Bạn có chắc chắn muốn huỷ đơn hàng này? Tiền sẽ được hoàn trả lại cho khách hàng.',
                      () => handleCancelOrder(),
                      'error'
                    )}
                    sx={{ mb: 1, fontWeight: 700, borderRadius: 2 }}
                  >
                    Huỷ đơn hàng
                  </Button>
                )}
                <Button fullWidth variant="outlined" onClick={() => setDetailOpen(false)} sx={{ fontWeight: 700, borderRadius: 2 }}>Đóng</Button>
                {selectedOrder?.status === 'IN_PROGRESS' && !isPendingExtension && (
                  <Button fullWidth variant="text" size="small" color="info" onClick={() => { setExtendingOrder(selectedOrder); setExtendOpen(true); }} sx={{ mt: 1, fontWeight: 700 }}>Gia hạn thời gian</Button>
                )}
                {isPendingExtension && (
                  <Typography variant="caption" align="center" sx={{ color: '#0284c7', mt: 1, fontWeight: 700 }}>
                    ⏳ Đang chờ khách đồng ý gia hạn thêm {selectedOrder?.pendingExtensionHours} giờ...
                  </Typography>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        <QuickChatDialog open={chatOpen} onClose={() => setChatOpen(false)} targetUser={targetChatUser} />

        {/* Generic Confirmation Dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>{confirmConfig.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">{confirmConfig.message}</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setConfirmOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Hủy</Button>
            <Button 
              variant="contained" 
              color={confirmConfig.color || 'primary'}
              onClick={() => {
                confirmConfig.onConfirm();
                setConfirmOpen(false);
              }} 
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Đồng ý
            </Button>
          </DialogActions>
        </Dialog>

        {/* Extend Dialog */}
        <Dialog open={extendOpen} onClose={() => setExtendOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Gia hạn thực hiện</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>Bạn muốn gia hạn thêm bao nhiêu giờ cho đơn hàng này?</Typography>
            <TextField
              fullWidth type="number" label="Số giờ thêm" value={extendHours}
              onChange={(e) => setExtendHours(e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">giờ</InputAdornment> }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setExtendOpen(false)} color="inherit">Hủy</Button>
            <Button variant="contained" onClick={handleExtend} disabled={extendLoading} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#7c3aed' }}>
              {extendLoading ? 'ĐANG LƯU...' : 'XÁC NHẬN'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SellerLayout>
  );
}
