'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Chip, TextField, InputAdornment,
  Skeleton, IconButton, Tooltip, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const STATUS_TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Tạm giữ', value: 'HOLDING' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Khiếu nại', value: 'DISPUTED' },
  { label: 'Đã hoàn tiền', value: 'REFUNDED' },
];

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mmo_user');
      const localUser = stored ? JSON.parse(stored) : null;
      const uid = user?.id || localUser?.id;
      if (!uid) return;

      const res = await fetch(`/api/me/seller-orders?userId=${uid}&status=${tabValue}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch seller orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, tabValue]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.product?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.buyer?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'HOLDING': return <Chip label="TẠM GIỮ" size="small" sx={{ fontWeight: 800, bgcolor: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', fontSize: '0.65rem' }} />;
      case 'COMPLETED': return <Chip label="HOÀN THÀNH" size="small" sx={{ fontWeight: 800, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.65rem' }} />;
      case 'DISPUTED': return <Chip label="KHIẾU NẠI" size="small" sx={{ fontWeight: 800, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.65rem' }} />;
      case 'REFUNDED': return <Chip label="ĐÃ HOÀN TIỀN" size="small" sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.65rem' }} />;
      default: return <Chip label={status} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
    }
  };

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Green Header Box */}
        <Box sx={{ bgcolor: '#16a34a', p: 3.5, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, color: 'white' }}>Đơn hàng đã bán</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Theo dõi và quản lý lịch sử giao dịch của bạn</Typography>
          </Box>
          <Button
            variant="contained" disableElevation
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            sx={{ borderRadius: 2, fontWeight: 900, px: 2, py: 1, bgcolor: 'white', color: '#16a34a', fontSize: '0.75rem', '&:hover': { bgcolor: '#f1f5f9' } }}
          >
            LÀM MỚI
          </Button>
        </Box>

        <Paper elevation={0} sx={{ p: 0, borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', bgcolor: 'white', overflow: 'hidden' }}>
          {/* Tabs Section */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, v) => setTabValue(v)}
              sx={{
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.85rem', minHeight: 60 },
                '& .Mui-selected': { color: '#16a34a !important' },
                '& .MuiTabs-indicator': { bgcolor: '#16a34a', height: 3 }
              }}
            >
              {STATUS_TABS.map(tab => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>

          {/* Search Row */}
          <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
            <TextField
              sx={{ flex: 1 }}
              placeholder="Tìm theo mã đơn, tên sản phẩm hoặc người mua..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: 'white' }
              }}
            />
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.5, color: '#16a34a' }}>MÃ ĐƠN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.5, color: '#16a34a' }}>SẢN PHẨM</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.5, color: '#16a34a' }}>NGƯỜI MUA</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.5, color: '#16a34a' }}>THANH TOÁN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.5, color: '#16a34a' }}>TRẠNG THÁI</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.5, color: '#16a34a' }} align="right">THAO TÁC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton height={50} /></TableCell></TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>Không tìm thấy đơn hàng nào.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                          #{order.id.slice(-8).toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {order.product?.thumbnail ? (
                             <Box component="img" src={order.product.thumbnail} sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                          ) : (
                            <Box sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #e2e8f0' }}>📦</Box>
                          )}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>{order.product?.title}</Typography>
                            {order.variantName && <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700 }}>{order.variantName}</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.buyer?.username}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                          {order.amount.toLocaleString('vi-VN')}đ
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(order.status)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Chi tiết">
                          <IconButton size="small" sx={{ border: '1px solid #e2e8f0' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ mt: 5, textAlign: 'center', pb: 5 }}>
           <Typography variant="caption" color="text.secondary">© 2026 SHOPMINI.NET - Quản Lý Đơn Hàng</Typography>
        </Box>
      </Box>
    </SellerLayout>
  );
}
