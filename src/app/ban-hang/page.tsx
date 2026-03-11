'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Button, Chip, Skeleton, Tooltip, TextField, InputAdornment, Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// New Components
import ProductForm from '@/components/seller/ProductForm';
import StockManager from '@/components/seller/StockManager';

export default function SellerProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [formOpen, setFormOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mmo_user');
      const localUser = stored ? JSON.parse(stored) : null;
      const uid = user?.id || localUser?.id;
      if (!uid) return;
      const res = await fetch(`/api/me/products?userId=${uid}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('mmo_user');
      if (!stored) {
        router.push('/dang-nhap');
        return;
      }
    } else {
      // Force refresh user to get exact latest balance/holdBalance
      fetch(`/api/me?userId=${user.id}`).then(res => res.json()).then(data => {
        if (data && data.id) {
          localStorage.setItem('mmo_user', JSON.stringify(data));
          // We don't have access to setUser here natively but this updates localStorage
          // so next refresh it's there. Better: just rely on the layout or trigger it.
        }
      });
    }
    fetchData();
  }, [user, router]);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleManageStock = (product: any) => {
    setSelectedProduct(product);
    setStockOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SiteLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2.5, color: '#16a34a', display: 'flex' }}>
              <StorefrontIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản lý hàng hóa</Typography>
              <Typography variant="body2" color="text.secondary">Quản lý danh sách sản phẩm và dịch vụ bạn đang bán</Typography>
            </Box>
          </Box>
          <Button
            variant="contained" disableElevation
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, py: 1.2, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Đăng sản phẩm mới
          </Button>
        </Box>

        {/* Balance Status */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, display: 'block', mb: 0.5 }}>SỐ DƯ KHẢ DỤNG</Typography>
            <Typography variant="h5" sx={{ color: '#16a34a', fontWeight: 800 }}>{user?.balance?.toLocaleString('vi-VN')} VNĐ</Typography>
          </Box>
          <Box sx={{ width: '1px', height: 40, bgcolor: '#bbf7d0' }} />
          <Box>
            <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600, display: 'block', mb: 0.5 }}>TIỀN CHỜ DUYỆT (TẠM GIỮ 3 NGÀY)</Typography>
            <Typography variant="h5" sx={{ color: '#d97706', fontWeight: 800 }}>
              {(() => {
                // Read fresh from localStorage if context is still old
                if (typeof window !== 'undefined') {
                   const stored = localStorage.getItem('mmo_user');
                   if (stored) {
                     try { return JSON.parse(stored).holdBalance?.toLocaleString('vi-VN') || '0'; } catch {}
                   }
                }
                return user?.holdBalance?.toLocaleString('vi-VN') || '0';
              })()} VNĐ
            </Typography>
          </Box>
        </Box>

        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Số dư từ các đơn hàng mới sẽ bị tạm giữ 3 ngày hoặc đến khi người mua xác nhận nhận hàng thành công để bảo vệ người dùng!
        </Alert>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          {[
            { label: 'Tổng sản phẩm', value: products.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Đang bán', value: products.filter(p => p.status === 'ACTIVE').length, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Tổng đã bán', value: products.reduce((s, p) => s + (p.soldCount || 0), 0), color: '#d97706', bg: '#fffbeb' },
            { label: 'Chờ duyệt', value: products.filter(p => p.status === 'PENDING').length, color: '#7c3aed', bg: '#f5f3ff' },
          ].map((stat) => (
            <Paper key={stat.label} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </Paper>
          ))}
        </Box>

        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm trong danh sách hàng hóa..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#f8fafc' }
            }}
          />
        </Paper>

        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Giá (VNĐ)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tồn kho</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Đã bán</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton height={50} /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">Bạn chưa có sản phẩm nào.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {p.thumbnail ? (
                           <Box component="img" src={p.thumbnail} sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</Box>
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.title}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.7rem' }}>#{p.id.slice(-8).toUpperCase()}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.category?.name || 'N/A'} size="small" sx={{ fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#dc2626' }}>
                        {p.price.toLocaleString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${p._count?.items ?? 0} acc`}
                        size="small"
                        color={(p._count?.items ?? 0) > 0 ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{p.soldCount}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status === 'ACTIVE' ? 'Đang bán' : (p.status === 'DELETED' ? 'Đã xóa' : 'Tạm ẩn')} 
                        size="small" 
                        color={p.status === 'ACTIVE' ? 'success' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Xem trên sàn">
                          <IconButton size="small" component={Link} href={`/san-pham/${p.slug}`}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Nạp kho">
                          <IconButton size="small" color="success" onClick={() => handleManageStock(p)}>
                            <InventoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sửa">
                          <IconButton size="small" color="primary" onClick={() => handleEdit(p)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialogs */}
        {user && (
          <ProductForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSuccess={fetchData}
            product={selectedProduct}
            sellerId={user.id}
          />
        )}

        {selectedProduct && (
          <StockManager
            open={stockOpen}
            onClose={() => setStockOpen(false)}
            productId={selectedProduct.id}
            productTitle={selectedProduct.title}
          />
        )}
      </Container>
    </SiteLayout>
  );
}
