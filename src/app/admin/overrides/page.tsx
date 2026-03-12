'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';

interface UserOverride {
  id: string;
  user: { username: string; email: string };
  maxBooths: number | null;
  maxItemsPerOrder: number | null;
  commissionRate: number | null;
  note: string | null;
  createdAt: string;
}

export default function AdminOverridesPage() {
  const [overrides, setOverrides] = useState<UserOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [maxBooths, setMaxBooths] = useState<string>('');
  const [maxItems, setMaxItems] = useState<string>('');
  const [commission, setCommission] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => { fetchOverrides(); }, []);

  const fetchOverrides = async () => {
    try {
      const res = await fetch('/api/admin/overrides');
      const data = await res.json();
      if (res.ok) setOverrides(data.overrides || []);
    } catch {
      toast.error('Lỗi tải danh sách ngoại lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (o: UserOverride) => {
    setUsername(o.user.username);
    setMaxBooths(o.maxBooths?.toString() || '');
    setMaxItems(o.maxItemsPerOrder?.toString() || '');
    setCommission(o.commissionRate?.toString() || '');
    setNote(o.note || '');
    setOpenForm(true);
  };

  const handleCreate = () => {
    setUsername(''); setMaxBooths(''); setMaxItems(''); setCommission(''); setNote('');
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!username.trim()) return toast.error('Vui lòng nhập Username');
    setSaving(true);
    try {
      const payload = {
        username,
        maxBooths: maxBooths ? Number(maxBooths) : null,
        maxItemsPerOrder: maxItems ? Number(maxItems) : null,
        commissionRate: commission ? Number(commission) : null,
        note: note || null,
      };

      const res = await fetch('/api/admin/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Lưu ngoại lệ thành công');
        fetchOverrides();
        setOpenForm(false);
      } else {
        toast.error(data.error || 'Lỗi lưu dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, uname: string) => {
    if (!window.confirm(`Xóa ngoại lệ của user @${uname}?`)) return;
    try {
      const res = await fetch(`/api/admin/overrides?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã xóa ngoại lệ của @${uname}`);
        setOverrides(prev => prev.filter(o => o.id !== id));
      } else {
        toast.error(data.error || 'Lỗi xóa');
      }
    } catch {
      toast.error('Lỗi kết nối mạng');
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Ngoại lệ thành viên
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} disableElevation sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
            Thêm ngoại lệ mới
          </Button>
        </Box>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Tài khoản</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Gian hàng l.đ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Items l.đ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Hoa hồng</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Ghi chú</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Đang tải...</TableCell></TableRow>
                ) : overrides.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Chưa có ngoại lệ nào</TableCell></TableRow>
                ) : overrides.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>@{row.user.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      {row.maxBooths !== null ? <Chip size="small" label={row.maxBooths} color="primary" variant="outlined" /> : <Typography variant="body2" color="text.secondary">Mặc định</Typography>}
                    </TableCell>
                    <TableCell>
                      {row.maxItemsPerOrder !== null ? <Chip size="small" label={row.maxItemsPerOrder} color="secondary" variant="outlined" /> : <Typography variant="body2" color="text.secondary">Mặc định</Typography>}
                    </TableCell>
                    <TableCell>
                      {row.commissionRate !== null ? <Chip size="small" label={`${row.commissionRate}%`} color="error" variant="outlined" /> : <Typography variant="body2" color="text.secondary">Mặc định</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.note || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(row.id, row.user.username)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog open={openForm} onClose={() => !saving && setOpenForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>{username && overrides.some(o => o.user.username === username) ? 'Sửa ngoại lệ' : 'Thêm ngoại lệ'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth label="Tên người dùng (Username) *" 
                  value={username} onChange={(e) => setUsername(e.target.value)} 
                  disabled={overrides.some(o => o.user.username === username)} // Cannot change username if editing
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Số gian hàng (Tối đa)" type="number" value={maxBooths} onChange={(e) => setMaxBooths(e.target.value)} placeholder="Mặc định" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Số items (Tối đa)" type="number" value={maxItems} onChange={(e) => setMaxItems(e.target.value)} placeholder="Mặc định" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Hoa hồng (%)" type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Mặc định" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Ghi chú cấu hình" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Khách hàng VIP..." multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenForm(false)} color="inherit" disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving} disableElevation sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </AdminLayout>
  );
}
