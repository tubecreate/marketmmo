'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider,
  Stack, Tooltip
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  type: string;
  price: number;
  createdAt: string;
  seller: { username: string };
  category: { name: string } | null;
  variants: ProductVariant[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPendingProducts(); }, []);

  const fetchPendingProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch {
      toast.error('Lỗi tải danh sách gian hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role: 'ADMIN' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(status === 'ACTIVE' ? 'Đã duyệt gian hàng' : 'Đã từ chối gian hàng');
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <StorefrontIcon sx={{ fontSize: 32, color: '#16a34a' }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Duyệt gian hàng mới
          </Typography>
        </Box>

        {loading ? (
          <Typography>Đang tải dữ liệu...</Typography>
        ) : products.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
            <Typography variant="h6" color="text.secondary" fontWeight={700}>
              Không có gian hàng nào đang chờ duyệt.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {products.map((p) => (
              <Grid size={{ xs: 12 }} key={p.id}>
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 100, height: 100, borderRadius: 2, bgcolor: '#f1f5f9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {p.thumbnail ? (
                          <Box component="img" src={p.thumbnail} alt={p.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <StorefrontIcon sx={{ color: '#94a3b8' }} />
                        )}
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{p.title}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={p.category?.name || 'Chưa phân loại'} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                              <Typography variant="caption" color="text.secondary">
                                Người bán: <strong>@{p.seller.username}</strong> • {new Date(p.createdAt).toLocaleString('vi-VN')}
                              </Typography>
                            </Stack>
                          </Box>
                          
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained" color="success" disableElevation
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleAction(p.id, 'ACTIVE')}
                              sx={{ borderRadius: 2, fontWeight: 700 }}
                            >
                              Duyệt
                            </Button>
                            <Button
                              variant="outlined" color="error" disableElevation
                              startIcon={<CancelIcon />}
                              onClick={() => handleAction(p.id, 'REJECTED')}
                              sx={{ borderRadius: 2, fontWeight: 700 }}
                            >
                              Từ chối
                            </Button>
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 8 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Mô tả:</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                            }}>
                              {p.description}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Các gói sản phẩm ({p.variants.length}):</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {p.variants.map((v) => (
                                <Tooltip key={v.id} title={`${v.name}: ${v.price.toLocaleString()}đ`}>
                                  <Chip label={v.name} size="small" sx={{ fontSize: '0.75rem' }} />
                                </Tooltip>
                              ))}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
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
