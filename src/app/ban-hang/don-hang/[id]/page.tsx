'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SellerLayout from '@/components/layout/SellerLayout';
import {
  Box, Typography, Paper, Grid, Button, Chip, Skeleton, 
  Divider, TextField, Stack, Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import OrderProgressStepper from '@/components/order/OrderProgressStepper';
import QuickChatDialog from '@/components/chat/QuickChatDialog';

interface Order {
  id: string;
  status: string;
  amount: number;
  quantity: number;
  fee: number;
  customPrice: number | null;
  negotiatedDeliveryHours: number | null;
  deliveredContent: string | null;
  startedAt: string | null;
  createdAt: string;
  variantName: string | null;
  product: {
    title: string;
    thumbnail: string | null;
    isService: boolean;
    description?: string;
  };
  buyer: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  HOLDING:   { label: 'Tạm giữ',    color: '#d97706', bg: '#fef3c7' },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  DISPUTED:  { label: 'Khiếu nại',  color: '#dc2626', bg: '#fee2e2' },
  PENDING:   { label: 'Đang xử lý', color: '#64748b', bg: '#f1f5f9' },
  REFUNDED:  { label: 'Đã hoàn tiền', color: '#7c3aed', bg: '#f5f3ff' },
  PRE_ORDER: { label: 'Đặt trước',  color: '#0284c7', bg: '#e0f2fe' },
  CANCELLED: { label: 'Đã huỷ',     color: '#94a3b8', bg: '#f1f5f9' },
  NEGOTIATING: { label: 'Thương lượng', color: '#f59e0b', bg: '#fef3c7' },
  PENDING_ACCEPTANCE: { label: 'Chờ xác nhận', color: '#0ea5e9', bg: '#e0f2fe' },
  IN_PROGRESS: { label: 'Đang làm', color: '#7c3aed', bg: '#f5f3ff' },
  DELIVERED: { label: 'Đã bàn giao', color: '#10b981', bg: '#dcfce7' },
};

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [deliveryContent, setDeliveryContent] = useState('');
  const [bidPrice, setBidPrice] = useState<string>('');
  const [bidHours, setBidHours] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        router.push('/ban-hang/dich-vu');
        return;
      }
      setOrder(data);
    } catch {
      toast.error('Lỗi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleAccept = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/accept-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xác nhận thực hiện đơn hàng!');
        fetchOrder();
      } else toast.error(data.error);
    } finally { setActionLoading(false); }
  };

  const handleDeliver = async () => {
    if (!order || !deliveryContent) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user?.id, content: deliveryContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã bàn giao đơn hàng thành công!');
        fetchOrder();
      } else toast.error(data.error);
    } finally { setActionLoading(false); }
  };

  const handleBid = async () => {
    if (!order || !bidPrice) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellerId: user?.id, 
          price: bidPrice,
          deliveryHours: bidHours 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã gửi báo giá thành công!');
        fetchOrder();
      } else toast.error(data.error);
    } finally { setActionLoading(false); }
  };

  if (loading) return <SellerLayout><Box sx={{ p: 4 }}><Skeleton variant="rectangular" height={400} /></Box></SellerLayout>;
  if (!order) return null;

  const totalRevenue = order.amount;
  const platformFee = order.fee;
  const netRevenue = totalRevenue - platformFee;

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 4 } }}>
        {/* Header Navigation */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.back()}
            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
            CHI TIẾT ĐƠN HÀNG
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <OrderProgressStepper status={order.status} />
        </Paper>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <Box sx={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                  {order.product.thumbnail ? (
                    <Box 
                      component="img" 
                      src={order.product.thumbnail} 
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                        (e.target as HTMLImageElement).style.display = 'none'; 
                        ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex'; 
                      }}
                      sx={{ width: '100%', height: '100%', borderRadius: 2, objectFit: 'cover', bgcolor: '#f1f5f9' }} 
                    />
                  ) : null}
                  <Box 
                    sx={{ 
                      display: order.product.thumbnail ? 'none' : 'flex',
                      width: '100%', height: '100%', borderRadius: 2, 
                      bgcolor: '#ebeef2', color: '#94a3b8',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', fontWeight: 800,
                      border: '2px solid #e2e8f0'
                    }}
                  >
                    {order.product.title.charAt(0).toUpperCase()}
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{order.product.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                    Mã đơn: <strong style={{ color: '#1e293b' }}>#{order.id.toUpperCase()}</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#ff0000' }}>
                      {order.amount.toLocaleString('vi-VN')} VNĐ
                    </Typography>
                    <Chip 
                      label={statusMap[order.status]?.label || order.status} 
                      size="small" 
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: statusMap[order.status]?.bg || '#f1f5f9', 
                        color: statusMap[order.status]?.color || '#64748b', 
                        borderRadius: 1 
                      }} 
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>PHÂN LOẠI</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{order.variantName || 'Mặc định'}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>KHÁCH HÀNG</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={order.buyer.avatar || undefined} sx={{ width: 32, height: 32 }}>{order.buyer.username[0]}</Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{order.buyer.username}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>THANH TOÁN</Typography>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Doanh thu đơn hàng:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{totalRevenue.toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Phí sàn (MarketMMO):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444' }}>-{platformFee.toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Thực nhận:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16a34a' }}>{netRevenue.toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>MÔ TẢ CÔNG VIỆC</Typography>
                  <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap', bgcolor: '#f1f5f9', p: 2, borderRadius: 2 }}>
                    {order.product.description || 'Không có mô tả chi tiết'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>YÊU CẦU CỦA KHÁCH HÀNG</Typography>
                  <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fef3c7', p: 2, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#854d0e' }}>
                      &quot;Vui lòng thực hiện nhanh giúp mình, mình đang cần gấp. Link youtube: https://youtube.com/...&quot;
                    </Typography>
                  </Box>
                </Box>

                {order.status === 'NEGOTIATING' && (
                  <Box sx={{ pt: 2 }}>
                    {!order.customPrice ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#f59e0b' }}>BÁO GIÁ DỊCH VỤ</Typography>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField 
                              fullWidth size="small" type="number"
                              label="Số tiền (VNĐ)"
                              placeholder="Ví dụ: 50000"
                              value={bidPrice}
                              onChange={(e) => setBidPrice(e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField 
                              fullWidth size="small" type="number"
                              label="Thời gian làm (Giờ)"
                              placeholder="Ví dụ: 24"
                              value={bidHours}
                              onChange={(e) => setBidHours(e.target.value)}
                            />
                          </Grid>
                        </Grid>
                        <Button 
                          fullWidth variant="contained" 
                          onClick={handleBid}
                          disabled={actionLoading || !bidPrice}
                          sx={{ py: 1.5, fontWeight: 800, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                        >
                          GỬI BÁO GIÁ CHO KHÁCH
                        </Button>
                      </>
                    ) : (
                      <Box sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#d97706' }}>ĐÃ GỬI BÁO GIÁ</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Giá đề xuất:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#ff0000' }}>{order.customPrice.toLocaleString('vi-VN')}đ</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Thời gian làm:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{order.negotiatedDeliveryHours || 24} giờ</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#92400e', fontStyle: 'italic' }}>
                          Đang chờ khách hàng chấp nhận báo giá...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {order.status === 'IN_PROGRESS' && (
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#7c3aed' }}>NỘI DUNG BÀN GIAO</Typography>
                    <TextField 
                      fullWidth multiline rows={4} 
                      placeholder="Nhập nội dung/Link sản phẩm bàn giao tại đây..."
                      value={deliveryContent}
                      onChange={(e) => setDeliveryContent(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      fullWidth variant="contained" 
                      onClick={handleDeliver}
                      disabled={actionLoading || !deliveryContent}
                      sx={{ py: 1.5, fontWeight: 800, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      BÀN GIAO NGAY
                    </Button>
                  </Box>
                )}

                {order.status === 'PENDING_ACCEPTANCE' && (
                  <Button 
                    fullWidth variant="contained" 
                    onClick={handleAccept}
                    disabled={actionLoading}
                    sx={{ py: 1.5, fontWeight: 800, bgcolor: '#3b82f6' }}
                  >
                    BẮT ĐẦU THỰC HIỆN CÔNG VIỆC
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#64748b' }}>TỔNG QUAN</Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>MÃ ĐƠN HÀNG</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>#{order.id.toUpperCase()}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>NGÀY ĐẶT</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>TRẠNG THÁI</Typography>
                    <Chip 
                      label={statusMap[order.status]?.label || order.status} 
                      size="small" 
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: statusMap[order.status]?.bg || '#f1f5f9', 
                        color: statusMap[order.status]?.color || '#64748b', 
                        mt: 0.5 
                      }} 
                    />
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>DOANH THU</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16a34a' }}>{netRevenue.toLocaleString('vi-VN')} VNĐ</Typography>
                  </Box>

                  <Button 
                    fullWidth variant="outlined" 
                    startIcon={<ChatIcon />}
                    onClick={() => setChatOpen(true)}
                    sx={{ mt: 2, borderRadius: 2, fontWeight: 700, borderColor: '#cbd5e1', color: '#1e293b' }}
                  >
                    CHAT VỚI KHÁCH HÀNG
                  </Button>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 3, border: '1px solid #fde68a', bgcolor: '#fffbeb' }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <CalendarTodayIcon sx={{ color: '#d97706', fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#854d0e' }}>CAM KẾT THỜI GIAN</Typography>
                    <Typography variant="body2" sx={{ color: '#92400e', mt: 0.5 }}>
                      Đơn hàng này cần hoàn thành trong vòng <strong>{order.negotiatedDeliveryHours || 24} giờ</strong> kể từ lúc bắt đầu.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <QuickChatDialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        targetUser={order.buyer} 
      />
    </SellerLayout>
  );
}
