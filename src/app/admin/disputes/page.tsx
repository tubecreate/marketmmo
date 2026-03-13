'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import GavelIcon from '@mui/icons-material/Gavel';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AdminDispute {
  id: string;
  reason: string;
  evidence: string | null;
  faultyCount: number;
  status: string;
  createdAt: string;
  order: {
    product: { title: string };
    buyer: { username: string };
    seller: { username: string };
    amount: number;
    quantity: number;
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (res.ok) setDisputes(data.disputes || []);
    } catch {
      toast.error('Lỗi tải danh sách tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <GavelIcon sx={{ fontSize: 32, color: '#dc2626' }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Quản lý tranh chấp (Cần xử lý)
          </Typography>
        </Box>

        {loading ? (
          <Typography>Đang tải dữ liệu...</Typography>
        ) : disputes.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
            <Typography variant="h6" color="text.secondary" fontWeight={700}>
              Tuyệt vời! Không có tranh chấp nào cần xử lý lúc này.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {disputes.map((d) => (
              <Grid size={{ xs: 12 }} key={d.id}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', border: '1px solid #e2e8f0', overflow: 'visible' }}>
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Chip size="small" label="Đang yêu cầu Admin can thiệp" sx={{ mb: 1.5, bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700, border: '1px solid #fecaca' }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 0.5 }}>
                          {d.order.product.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Mã tranh chấp: #{d.id.slice(-8).toUpperCase()} • {new Date(d.createdAt).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained" disableElevation
                        startIcon={<ForumIcon />}
                        onClick={() => router.push(`/ban-hang/khieu-nai/${d.id}`)}
                        sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 2, fontWeight: 700 }}
                      >
                        Vào phòng xử lý
                      </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={4}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Bên Mua (Người khiếu nại)</Typography>
                        <Typography variant="body2" fontWeight={800} color="#0369a1" sx={{ mt: 0.5 }}>
                          @{d.order.buyer.username}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Bên Bán (Shop)</Typography>
                        <Typography variant="body2" fontWeight={800} color="#b45309" sx={{ mt: 0.5 }}>
                          @{d.order.seller.username}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Item lỗi báo cáo</Typography>
                        <Typography variant="body2" fontWeight={800} color="error" sx={{ mt: 0.5 }}>
                          {d.faultyCount} lỗi
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Giá trị tranh chấp</Typography>
                        <Typography variant="body2" fontWeight={800} color="error" sx={{ mt: 0.5 }}>
                          {((d.order.amount / d.order.quantity) * d.faultyCount).toLocaleString('vi-VN')}đ
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" fontWeight={700} color="#64748b">LÝ DO KHIẾU NẠI:</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: '#334155' }}>{d.reason}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AdminLayout>
  );
}
