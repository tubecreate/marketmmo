'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  CircularProgress, Alert, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2Icon from '@mui/icons-material/Inventory2';

interface Variant {
  id: string;
  name: string;
  price: number | string;
  description: string | null;
}

interface VariantFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  variant?: Variant | null;
}

export default function VariantForm({ open, onClose, onSuccess, productId, variant }: VariantFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (variant) {
        setFormData({
          name: variant.name,
          price: String(variant.price),
          description: variant.description || '',
        });
      } else {
        setFormData({ name: '', price: '', description: '' });
      }
      setError('');
    }
  }, [open, variant]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      setError('Vui lòng nhập tên và giá sản phẩm');
      return;
    }

    setLoading(true);
    setError('');
    
    const url = variant 
      ? `/api/variants/${variant.id}` 
      : `/api/products/${productId}/variants`;
    const method = variant ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 1.5, color: '#16a34a', display: 'flex' }}>
              <Inventory2Icon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {variant ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth label="Tên sản phẩm *"
            placeholder="VD: Gmail 2020-2022"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            fullWidth label="Giá (VNĐ) *"
            type="number"
            placeholder="49000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            fullWidth multiline rows={3} label="Mô tả sản phẩm"
            placeholder="Thông tin thêm về sản phẩm này..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Hủy</Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ 
            fontWeight: 800, px: 4, borderRadius: 2,
            bgcolor: '#16a34a !important', color: 'white !important',
            '&:hover': { bgcolor: '#15803d !important' }
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (variant ? 'Lưu thay đổi' : 'Thêm ngay')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
