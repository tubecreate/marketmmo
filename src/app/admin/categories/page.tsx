'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem,
  IconButton, Chip, Alert, Skeleton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  _count?: {
    products: number;
    children: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [open, setOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', parentId: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      setError('Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpen = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({ name: cat.name, slug: cat.slug, parentId: cat.parentId || '' });
    } else {
      setEditingCat(null);
      setFormData({ name: '', slug: '', parentId: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    const url = editingCat ? `/api/admin/categories/${editingCat.id}` : '/api/admin/categories';
    const method = editingCat ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
        handleClose();
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchCategories();
      else alert(data.error || 'Xóa thất bại');
    } catch {
      alert('Lỗi kết nối khi xóa');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>Quản lý danh mục</Typography>
          <Typography variant="body2" color="text.secondary">Tạo và quản lý các danh mục sản phẩm (Cha/Con)</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700, borderRadius: 2 }}
        >
          Thêm danh mục
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>TÊN DANH MỤC</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SLUG</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>DANH MỤC CHA</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">SẢN PHẨM</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">THAO TÁC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [1,2,3,4].map(i => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton height={40} /></TableCell></TableRow>
              ))
            ) : categories.map((cat) => (
              <TableRow key={cat.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: cat.parentId ? 400 : 700 }}>
                    {cat.parentId ? `└─ ${cat.name}` : cat.name}
                  </Typography>
                </TableCell>
                <TableCell><Typography variant="caption" sx={{ color: 'text.secondary' }}>{cat.slug}</Typography></TableCell>
                <TableCell>
                  {cat.parentId ? (
                    <Chip size="small" label={categories.find(p => p.id === cat.parentId)?.name || 'N/A'} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">-- Gốc --</Typography>
                  )}
                </TableCell>
                <TableCell align="center">{cat._count?.products || 0}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(cat)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CRUD Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingCat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            fullWidth label="Tên danh mục"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({ ...formData, name, slug: generateSlug(name) });
            }}
          />
          <TextField
            fullWidth label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />
          <TextField
            select fullWidth label="Danh mục cha (Bỏ trống nếu là gốc)"
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          >
            <MenuItem value="">-- Danh mục gốc --</MenuItem>
            {categories.filter(c => !c.parentId && c.id !== editingCat?.id).map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700 }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
