'use client';
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField,
  Button, InputAdornment, IconButton, Alert, CircularProgress,
  IconButton as MuiIconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
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
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StorefrontIcon sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Đăng nhập</Typography>
        </Box>
        <MuiIconButton onClick={onClose} size="small">
          <CloseIcon />
        </MuiIconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Chào mừng bạn trở lại! Đăng nhập để tiếp tục mua sắm.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="username" label="Tên đăng nhập hoặc Email"
            value={form.username} onChange={handleChange} fullWidth required size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }}
          />
          <TextField
            name="password" label="Mật khẩu"
            type={showPass ? 'text' : 'password'}
            value={form.password} onChange={handleChange} fullWidth required size="small"
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

          <Button type="submit" variant="contained" fullWidth size="large"
            disabled={loading}
            sx={{ fontWeight: 700, mt: 1, py: 1.25 }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 1 }}>
             <Typography variant="caption" color="text.secondary">
               Chưa có tài khoản?{' '}
               <Box component="span" sx={{ color: '#16a34a', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => { /* maybe handle register too */ }}>
                 Đăng ký ngay
               </Box>
             </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
