'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Typography, Paper, Grid, Button, Chip, Skeleton, 
  Divider, Container, Stack, Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ForumIcon from '@mui/icons-material/Forum';
import ShieldIcon from '@mui/icons-material/Shield';
import { toast } from 'sonner';
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
  buyerNote: string | null;
  product: {
    title: string;
    thumbnail: string | null;
    isService: boolean;
    description?: string;
  };
  seller: {
    id: string;
    username: string;
    avatar: string | null;
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
  PENDING_ACCEPTANCE: { label: 'Chờ NB xác nhận', color: '#0ea5e9', bg: '#e0f2fe' },
  IN_PROGRESS: { label: 'Đang làm', color: '#7c3aed', bg: '#f5f3ff' },
  DELIVERED: { label: 'Đã bàn giao', color: '#10b981', bg: '#dcfce7' },
};

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        router.push('/tai-khoan/don-hang');
        return;
      }
      setOrder(data);
    } catch {
      toast.error('Lỗi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const handleAcceptBid = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/accept-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: order.buyer.id }), // This might need the logged in user ID but the order object has it
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Chấp nhận báo giá và thanh toán thành công!');
        fetchOrder();
      } else toast.error(data.error);
    } catch {
      toast.error('Lỗi khi chấp nhận báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) return <SiteLayout><Container sx={{ py: 4 }}><Skeleton variant="rectangular" height={400} /></Container></SiteLayout>;
  if (!order) return null;

  const totalAmount = order.amount;

  return (
    <SiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>NGƯỜI BÁN</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={order.seller.avatar || undefined} sx={{ width: 32, height: 32 }}>{order.seller.username[0]}</Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{order.seller.username}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>YÊU CẦU CỦA BẠN</Typography>
                  <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fef3c7', p: 2, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#854d0e' }}>
                      {order.buyerNote || 'Bạn chưa để lại yêu cầu cụ thể.'}
                    </Typography>
                  </Box>
                </Box>

                {order.status === 'NEGOTIATING' && order.customPrice && (
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#f59e0b' }}>BÁO GIÁ TỪ NGƯỜI BÁN</Typography>
                    <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: '#854d0e', display: 'block' }}>GIÁ ĐỀ XUẤT</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#ff0000' }}>
                            {order.customPrice.toLocaleString('vi-VN')} VNĐ
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: '#854d0e', display: 'block' }}>THỜI GIAN LÀM</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {order.negotiatedDeliveryHours || 24} Giờ
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                    <Button 
                      fullWidth variant="contained" 
                      onClick={handleAcceptBid}
                      disabled={actionLoading}
                      sx={{ py: 1.5, fontWeight: 800, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      CHẤP NHẬN & THANH TOÁN
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#64748b' }}>
                      * Tiền sẽ được tạm giữ an toàn bởi hệ thống cho đến khi bạn xác nhận hoàn tất.
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#64748b' }}>TỔNG THANH TOÁN</Typography>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Tổng tiền:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16a34a' }}>{totalAmount.toLocaleString('vi-VN')} VNĐ</Typography>
                    </Box>
                  </Box>
                </Box>

                {order.deliveredContent && (
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#16a34a' }}>NỘI DUNG ĐÃ NHẬN</Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {order.deliveredContent}
                      </Typography>
                    </Paper>
                  </Box>
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

                  <Button 
                    fullWidth variant="contained" 
                    startIcon={<ForumIcon />}
                    onClick={() => setChatOpen(true)}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, bgcolor: '#2563eb' }}
                  >
                    LIÊN HỆ NGƯỜI BÁN
                  </Button>

                  <Button 
                    fullWidth variant="outlined" 
                    color="error"
                    startIcon={<ShieldIcon />}
                    sx={{ py: 1.3, borderRadius: 2, fontWeight: 700 }}
                  >
                    KHIẾU NẠI ĐƠN HÀNG
                  </Button>
                </Stack>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <QuickChatDialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        targetUser={order.seller} 
      />
    </SiteLayout>
  );
}
