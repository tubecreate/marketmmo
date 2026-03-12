'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SellerLayout from '@/components/layout/SellerLayout';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Button, Chip, Skeleton, Tooltip, TextField, InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// New Components
import ProductForm from '@/components/seller/ProductForm';
import StockManager from '@/components/seller/StockManager';

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceMax?: number;
  status: string;
  createdAt: string;
  thumbnail?: string;
  variants?: any[];
}

export default function SellerProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [formOpen, setFormOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
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
  }, [user?.id]);

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
  }, [user, router, fetchData]);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleManageStock = (product: Product) => {
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
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Green Header Box */}
        <Box sx={{ bgcolor: '#16a34a', p: 3.5, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, color: 'white' }}>Kho sản phẩm</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.15)', px: 1.5, py: 0.8, borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                💡 Mẹo: Nhận ⚙️ để quản lý giá & tồn kho, 📝 để sửa thông tin.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={handleAdd}
            sx={{ 
              borderRadius: 1.5, fontWeight: 700, px: 2, py: 0.8, 
              bgcolor: 'rgba(255,255,255,0.15) !important', color: 'white !important', 
              fontSize: '0.75rem',
              border: '1px solid rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25) !important' },
              transition: 'all 0.2s'
            }}
          >
            THÊM SẢN PHẨM
          </Button>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: '0 0 12px 12px', 
            border: '1px solid #e2e8f0', 
            borderTop: 'none',
            bgcolor: 'white' 
          }}
        >
          {/* Filters Row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              sx={{ flex: 1 }}
              placeholder="Tìm tên sản phẩm..."
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
            <TextField
              select
              size="small"
              defaultValue="all"
              sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              SelectProps={{ native: true }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="hidden">Tạm ẩn</option>
            </TextField>
            <Button variant="contained" disableElevation sx={{ bgcolor: '#16a34a', color: 'white', fontWeight: 800, px: 4, borderRadius: 2, '&:hover': { bgcolor: '#15803d' } }}>
              LỌC DỮ LIỆU
            </Button>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>THAO TÁC</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>SẢN PHẨM</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>KHO GIÁ</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>TRẠNG THÁI</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 2, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>NGÀY TẠO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton height={50} /></TableCell></TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">Bạn chưa có sản phẩm nào.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => (
                    <TableRow key={p.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Nạp kho">
                            <IconButton 
                              size="small" 
                              onClick={() => handleManageStock(p)}
                              sx={{ border: '1px solid #e2e8f0', color: '#0284c7' }}
                            >
                              <InventoryIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sửa">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEdit(p)}
                              sx={{ border: '1px solid #e2e8f0', color: '#d97706' }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(p.id)}
                              sx={{ border: '1px solid #e2e8f0', color: '#94a3b8' }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {p.thumbnail ? (
                             <Box component="img" src={p.thumbnail} sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                          ) : (
                            <Box sx={{ width: 44, height: 44, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #e2e8f0' }}>📦</Box>
                          )}
                          <Box>
                            <Typography 
                              variant="body2" 
                              component={Link} 
                              href={`/san-pham/${p.slug}`}
                              sx={{ fontWeight: 700, color: '#334155', textDecoration: 'none', '&:hover': { color: '#1d4ed8', textDecoration: 'underline' } }}
                            >
                              {p.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>{p.variants?.length || 0} Phân loại sẵn có</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                          {p.price.toLocaleString('vi-VN')}đ - {p.priceMax ? p.priceMax.toLocaleString('vi-VN') + 'đ' : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>VNĐ / Item</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={p.status === 'ACTIVE' ? 'ĐANG BÁN' : 'TẠM ẨN'} 
                          size="small" 
                          sx={{ 
                            fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5,
                            bgcolor: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                            color: p.status === 'ACTIVE' ? '#166534' : '#64748b',
                            border: '1px solid',
                            borderColor: p.status === 'ACTIVE' ? '#bbf7d0' : '#e2e8f0'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Balance Status (Repositioned or stylized if needed, but the user image doesn't show it in the same box) */}
        {/* We can keep it below or in the sidebar later */}

        
        {/* Dialogs */}
        {user && (
          <ProductForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSuccess={fetchData}
            product={selectedProduct as any}
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
      </Box>
    </SellerLayout>
  );
}
