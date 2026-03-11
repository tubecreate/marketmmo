'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, Divider, Alert, alpha, CircularProgress,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    const result = await register(form.username, form.email, form.password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => router.push('/dang-nhap'), 1500);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #f8fafc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}>
            <StorefrontIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            <Box component="span" sx={{ color: '#16a34a' }}>MARKET</Box>MMO
          </Typography>
          <Typography variant="body2" color="text.secondary">Tạo tài khoản miễn phí</Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 40px rgba(22,163,74,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Đăng ký tài khoản</Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="username" label="Tên đăng nhập" value={form.username} onChange={handleChange} fullWidth required
              helperText="Không dấu, không khoảng trắng"
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField name="email" label="Email" type="email" value={form.email} onChange={handleChange} fullWidth required
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField name="password" label="Mật khẩu" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} fullWidth required
              helperText="Ít nhất 8 ký tự"
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPass((p) => !p)}>{showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
              }}
            />
            <TextField name="confirmPassword" label="Xác nhận mật khẩu" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth required
              InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />

            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2, fontSize: '0.8rem', py: 0.5 }}>
              Thông tin phải chính xác và trung thực. Thông tin sai lệch sẽ dẫn đến <strong>khóa tài khoản vĩnh viễn</strong>.
            </Alert>

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ fontWeight: 700, py: 1.25, fontSize: '0.95rem' }}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>

            <Divider><Typography variant="caption" color="text.secondary">hoặc</Typography></Divider>

            <Button variant="outlined" fullWidth startIcon={<TelegramIcon />}
              sx={{ borderColor: '#26a5e4', color: '#26a5e4', fontWeight: 600, '&:hover': { borderColor: '#26a5e4', bgcolor: alpha('#26a5e4', 0.06) } }}
            >
              Đăng ký qua Telegram
            </Button>
          </Box>

          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Đã có tài khoản?{' '}
              <Link href="/dang-nhap">
                <Box component="span" sx={{ color: '#16a34a', fontWeight: 700 }}>Đăng nhập</Box>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
