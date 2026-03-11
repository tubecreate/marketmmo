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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.username, form.password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/tai-khoan');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #f8fafc 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4,
      }}
    >
      <Box sx={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', bgcolor: alpha('#16a34a', 0.06), zIndex: 0 }} />
      <Box sx={{ position: 'fixed', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', bgcolor: alpha('#16a34a', 0.04), zIndex: 0 }} />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}>
            <StorefrontIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            <Box component="span" sx={{ color: '#16a34a' }}>MARKET</Box>MMO
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Chào mừng bạn trở lại!
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 40px rgba(22,163,74,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Đăng nhập</Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="username" label="Tên đăng nhập hoặc Email"
              value={form.username} onChange={handleChange} fullWidth required
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField
              name="password" label="Mật khẩu"
              type={showPass ? 'text' : 'password'}
              value={form.password} onChange={handleChange} fullWidth required
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass((p) => !p)}>
                      {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/quen-mat-khau">
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Quên mật khẩu?
                </Typography>
              </Link>
            </Box>

            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              sx={{ fontWeight: 700, py: 1.25, fontSize: '0.95rem' }}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Divider><Typography variant="caption" color="text.secondary">hoặc</Typography></Divider>

            <Button variant="outlined" fullWidth startIcon={<TelegramIcon />}
              sx={{ borderColor: '#26a5e4', color: '#26a5e4', fontWeight: 600, '&:hover': { borderColor: '#26a5e4', bgcolor: alpha('#26a5e4', 0.06) } }}
            >
              Đăng nhập qua Telegram
            </Button>
          </Box>

          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có tài khoản?{' '}
              <Link href="/dang-ky">
                <Box component="span" sx={{ color: '#16a34a', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }}>
                  Đăng ký ngay
                </Box>
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2, fontSize: '0.8rem', bgcolor: alpha('#16a34a', 0.04), borderColor: alpha('#16a34a', 0.2) }}
          icon={<LockOutlinedIcon sx={{ fontSize: 18, color: '#16a34a' }} />}
        >
          Tài khoản demo: <strong>truongphuchl</strong> / <strong>123456</strong>
        </Alert>
      </Container>
    </Box>
  );
}
