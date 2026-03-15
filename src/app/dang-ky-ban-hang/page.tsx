'use client';
import React, { useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, Grid, Chip, Divider, alpha,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import FacebookIcon from '@mui/icons-material/Facebook';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const importantInfo = [
  'Hồ sơ của bạn sẽ được Admin xét duyệt trước khi kích hoạt quyền Người bán',
  'Bạn chỉ có thể tạo gian hàng sau khi hồ sơ đã được duyệt thành công',
  'Họ và Tên đăng ký phải trùng khớp với tên chủ tài khoản ngân hàng để đảm bảo quá trình rút tiền được xử lý chính xác',
  'Số tiền rút tối thiểu là 300.000đ. Doanh thu dưới mức này sẽ được tích lũy cho đến khi đủ điều kiện rút',
  'Phí sàn (hoa hồng) tùy thuộc vào danh mục sản phẩm và sẽ được trừ tự động trên mỗi đơn hàng thành công',
];

export default function SellerRegisterPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '', 
    phone: user?.phone || '', 
    facebook: '', 
    cccd: '', 
    bankName: user?.bankName || '', 
    bankAccount: user?.bankAccount || '', 
    telegram: user?.telegramId || '',
  });

  const isPending = user?.sellerRequest?.status === 'PENDING';
  const isApproved = user?.role === 'SELLER';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập');
    setLoading(true);

    try {
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Gửi yêu cầu thành công! Vui lòng chờ admin duyệt.');
        await refreshUser();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  if (isApproved) {
    return (
      <SiteLayout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: '#16a34a', mb: 2 }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>Bạn đã là Người bán!</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Tài khoản của bạn đã có quyền người bán. Hãy bắt đầu kinh doanh ngay.</Typography>
          <Button variant="contained" size="large" onClick={() => router.push('/ban-hang')} sx={{ borderRadius: 3, px: 6 }}>Vào trang quản lý</Button>
        </Container>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <StorefrontIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Đăng ký trở thành người bán
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Hoàn thành thông tin để bắt đầu bán hàng trên nền tảng của chúng tôi
          </Typography>
        </Paper>

        {isPending && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>
            Hồ sơ của bạn đang được xét duyệt. Vui lòng chờ phản hồi từ Admin.
          </Alert>
        )}

        {/* Important info */}
        <Alert
          severity="info"
          variant="outlined"
          icon={<CheckCircleOutlineIcon sx={{ color: '#16a34a' }} />}
          sx={{ mb: 3, borderRadius: 2.5, bgcolor: alpha('#16a34a', 0.03), borderColor: alpha('#16a34a', 0.3), p: 2.5 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#15803d' }}>
            ⚠️ Thông tin quan trọng
          </Typography>
          {importantInfo.map((info, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'flex-start' }}>
              <FiberManualRecordIcon sx={{ fontSize: 8, color: '#16a34a', mt: 0.75, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {info}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-start' }}>
            <FiberManualRecordIcon sx={{ fontSize: 8, color: '#dc2626', mt: 0.75, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
              <WarningAmberIcon sx={{ fontSize: 14, color: '#dc2626', verticalAlign: 'middle', mr: 0.5 }} />
              <Box component="span" sx={{ fontWeight: 700 }}>Cung cấp thông tin chính xác và trung thực.</Box>{' '}
              <Box component="span" sx={{ color: '#dc2626', fontWeight: 700 }}>Thông tin sai lệch sẽ bị từ chối.</Box>
            </Typography>
          </Box>
        </Alert>

        {/* Form */}
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative' }}>
          {isPending && <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.5)', zIndex: 10, borderRadius: 3 }} />}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#16a34a' }}>Thông tin cá nhân</Typography>

            <TextField
              name="fullName" label="Họ và Tên *" value={form.fullName} onChange={handleChange}
              fullWidth helperText="Nhập đầy đủ Họ và Tên của bạn" sx={{ mb: 2.5 }}
              disabled={isPending}
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}><PersonIcon fontSize="small" /></Box> }}
            />

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="phone" label="Số điện thoại *" value={form.phone} onChange={handleChange} fullWidth
                  disabled={isPending}
                  InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}><PhoneIcon fontSize="small" /></Box> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="facebook" label="Link Facebook *" value={form.facebook} onChange={handleChange} fullWidth
                  placeholder="https://facebook.com/..." disabled={isPending}
                  InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: '#1877f2' }}><FacebookIcon fontSize="small" /></Box> }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="cccd" label="Số CCCD / CMND *" value={form.cccd} onChange={handleChange} fullWidth
                  disabled={isPending}
                  InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}><CreditCardIcon fontSize="small" /></Box> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="telegram" label="Username Telegram" value={form.telegram} onChange={handleChange} fullWidth
                  placeholder="@username" disabled={isPending}
                  InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: '#26a5e4' }}><TelegramIcon fontSize="small" /></Box> }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1, mb: 2.5 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#16a34a' }}>Thông tin ngân hàng</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="bankName" label="Tên ngân hàng *" value={form.bankName} onChange={handleChange} fullWidth
                  placeholder="VD: MB Bank, Vietcombank..." disabled={isPending}
                  InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}><AccountBalanceIcon fontSize="small" /></Box> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="bankAccount" label="Số tài khoản ngân hàng *" value={form.bankAccount} onChange={handleChange} fullWidth
                  disabled={isPending}
                  InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}><CreditCardIcon fontSize="small" /></Box> }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading || isPending}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem', borderRadius: 2.5 }}
            >
              {loading ? 'Đang gửi...' : 'Đăng Ký Bán Hàng'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </SiteLayout>
  );
}
