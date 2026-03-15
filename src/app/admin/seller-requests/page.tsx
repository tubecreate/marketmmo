'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Divider,
  Stack, Avatar, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';

interface SellerRequest {
  id: string;
  user: { username: string; email: string };
  fullName: string;
  phone: string;
  facebook: string;
  cccd: string;
  bankName: string;
  bankAccount: string;
  telegram: string | null;
  createdAt: string;
}

export default function AdminSellerRequestsPage() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/seller-requests');
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch {
      toast.error('Lỗi tải yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/seller-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, adminNote: status === 'REJECTED' ? note : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(status === 'APPROVED' ? 'Đã duyệt người bán' : 'Đã từ chối');
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setRejectId(null);
        setNote('');
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <GroupAddIcon sx={{ fontSize: 32, color: '#16a34a' }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Duyệt đăng ký bán hàng
          </Typography>
        </Box>

        {loading ? (
          <Typography>Đang tải dữ liệu...</Typography>
        ) : requests.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
            <Typography variant="h6" color="text.secondary" fontWeight={700}>
              Không có yêu cầu nào đang chờ duyệt.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {requests.map((r) => (
              <Grid size={{ xs: 12 }} key={r.id}>
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#16a34a' }}><PersonIcon /></Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>{r.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            User: <strong>@{r.user.username}</strong> ({r.user.email}) • {new Date(r.createdAt).toLocaleString('vi-VN')}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained" color="success" disableElevation
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleAction(r.id, 'APPROVED')}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Duyệt
                        </Button>
                        <Button
                          variant="outlined" color="error" disableElevation
                          startIcon={<CancelIcon />}
                          onClick={() => setRejectId(r.id)}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Từ chối
                        </Button>
                      </Stack>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>SĐT / TELEGRAM</Typography>
                        <Typography variant="body2">{r.phone} / {r.telegram || 'N/A'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>FACEBOOK / CCCD</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{r.facebook} / {r.cccd}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>NGÂN HÀNG / STK</Typography>
                        <Typography variant="body2">{r.bankName} - {r.bankAccount}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={Boolean(rejectId)} onClose={() => setRejectId(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Từ chối yêu cầu</DialogTitle>
        <DialogContent>
          <TextField
              fullWidth multiline rows={3} placeholder="Lý do từ chối..."
              value={note} onChange={(e) => setNote(e.target.value)}
              sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectId(null)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={() => rejectId && handleAction(rejectId, 'REJECTED')}>Xác nhận từ chối</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
