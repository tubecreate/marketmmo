'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SellerLayout from '@/components/layout/SellerLayout';
import VariantForm from '@/components/seller/VariantForm';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Button, Chip, Skeleton, Tooltip, Stack, Divider, Alert, Container
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/context/AuthContext';
import StockManager from '@/components/seller/StockManager';
import ProductForm from '@/components/seller/ProductForm';

interface Variant {
  id: string;
  name: string;
  price: number;
  allowBidding: boolean;
  description: string | null;
  _count?: {
    items: number;
  };
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  categoryId: string;
  thumbnail: string;
  warrantyDays: number;
  type: string;
  isService: boolean;
  allowBidding: boolean;
  variants: Variant[];
  sellerId: string;
}

export default function ProductManagementPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [stockOpen, setStockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{id: string, name: string} | null>(null);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Fetch variants with stock counts
      const varRes = await fetch(`/api/products/${productId}/variants`);
      const varData = await varRes.json();
      
      setProduct({ ...data, variants: varData.variants || [] });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi tải dữ liệu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) fetchData();
  }, [productId, fetchData]);

  const handleOpenStock = (variant: Variant) => {
    setSelectedVariant({ id: variant.id, name: variant.name });
    setStockOpen(true);
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setVariantFormOpen(true);
  };

  const handleAddVariant = () => {
    setEditingVariant(null);
    setVariantFormOpen(true);
  };

  const handleVariantDelete = async (variantId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác nếu sản phẩm đã có lịch sử giao dịch.')) return;
    try {
      const res = await fetch(`/api/variants/${variantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Xóa sản phẩm thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi xóa sản phẩm');
    }
  };

  if (loading) return <SellerLayout><Box sx={{ p: 4 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} /></Box></SellerLayout>;
if (error || !product) return <SellerLayout><Box sx={{ p: 4 }}><Alert severity="error">{error || 'Không tìm thấy gian hàng'}</Alert></Box></SellerLayout>;

  return (
    <SellerLayout>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ bgcolor: '#16a34a', p: 3, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>
            DANH SÁCH SẢN PHẨM: {product.title}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ bgcolor: 'black !important', color: 'white', fontWeight: 700, borderRadius: 2, fontSize: '0.75rem' }}
            >
              TRỞ VỀ
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddVariant}
              sx={{ bgcolor: 'black !important', color: 'white', fontWeight: 700, borderRadius: 2, fontSize: '0.75rem' }}
            >
              THÊM SẢN PHẨM
            </Button>
          </Stack>
        </Box>

        <Paper elevation={0} sx={{ p: 3, borderRadius: '0 0 12px 12px', border: '1px solid #dcfce7', bgcolor: 'white' }}>
          {/* Guide Box */}
          <Paper sx={{ p: 3, mb: 4, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
             <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
               ℹ️ HƯỚNG DẪN QUẢN LÝ SẢN PHẨM
             </Typography>
             <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 4 }}>
               <Box>
                 <Typography variant="body2" sx={{ color: '#15803d', mb: 1 }}>
                    <Box component="span" sx={{ fontWeight: 800 }}>📂 Thủ công (Manual):</Box> Bạn tự tải file account (txt, zip...) lên hệ thống. Kho hàng giảm khi có người mua.
                 </Typography>
                 <Typography variant="body2" sx={{ color: '#15803d' }}>
                    <Box component="span" sx={{ fontWeight: 800 }}>🤖 API (ShopClone/Private):</Box> Hệ thống tự động lấy hàng từ kho nguồn khi có đơn. Kho hàng tự động đồng bộ.
                 </Typography>
               </Box>
               <Box>
                 <Typography variant="body2" sx={{ color: '#15803d', mb: 1 }}>
                    <Box component="span" sx={{ fontWeight: 800 }}>⚙️ Cấu hình:</Box> Thêm sản phẩm -&gt; Chọn &quot;Kết nối API&quot; -&gt; Lưu -&gt; Bấm nút ⚙️ ở cột thao tác để nhập Key &amp; ID.
                 </Typography>
                 <Typography variant="body2" sx={{ color: '#15803d' }}>
                    <Box component="span" sx={{ fontWeight: 800 }}>🔄 Đồng bộ kho:</Box> Bấm nút 🔄 để cập nhật số lượng hàng tồn mới nhất từ nguồn API.
                 </Typography>
               </Box>
             </Box>
          </Paper>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase' }}>THAO TÁC</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase' }}>TÊN SẢN PHẨM</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase' }}>THÔNG TIN</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase' }}>KHO HÀNG</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase' }}>BẢO HÀNH</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#15803d', textTransform: 'uppercase' }}>LOẠI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {product.variants.map((v) => (
                  <TableRow key={v.id} hover sx={{ '& td': { borderBottom: '1px solid #dcfce7' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Nhập kho">
                          <IconButton size="small" onClick={() => handleOpenStock(v)} sx={{ border: '1px solid #bbf7d0', color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                            <FileUploadIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sửa sản phẩm">
                          <IconButton size="small" onClick={() => handleEditVariant(v)} sx={{ border: '1px solid #bbf7d0', color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa sản phẩm">
                          <IconButton size="small" onClick={() => handleVariantDelete(v.id)} sx={{ border: '1px solid #fee2e2', color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ẩn/Hiện">
                          <IconButton size="small" sx={{ border: '1px solid #bbf7d0', color: '#64748b' }}>
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{v.name}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: v.allowBidding ? '#ea580c' : '#15803d', fontWeight: 600 }}>
                        {v.allowBidding ? 'Chế độ: Thương lượng' : `Giá: ${v.price.toLocaleString('vi-VN')}đ`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${v._count?.items || 0} ACCOUNTS`} 
                        size="small" 
                        sx={{ bgcolor: '#f43f5e', color: 'white', fontWeight: 800, fontSize: '0.6rem', borderRadius: 1 }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="BẢO HÀNH LOGIN" size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#475569' }} />
                    </TableCell>
                     <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Box sx={{ fontSize: '0.8rem' }}>📄</Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>Thủ công</Typography>
                        </Stack>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Product Meta Section */}
          <Divider sx={{ my: 4, borderColor: '#dcfce7' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
               <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Thông tin gian hàng</Typography>
               <Typography variant="caption" color="text.secondary">Chỉnh sửa thông tin cơ bản, ảnh đại diện, danh mục và mô tả.</Typography>
            </Box>
            <Button 
               variant="outlined" 
               startIcon={<EditIcon />}
               onClick={() => setEditOpen(true)}
               sx={{ borderRadius: 2, fontWeight: 700, color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' } }}
            >
               SỬA THÔNG TIN GIAN HÀNG
            </Button>
          </Box>
        </Paper>

        {/* Dialogs */}
        {selectedVariant && (
          <StockManager
            open={stockOpen}
            onClose={() => setStockOpen(false)}
            productId={product.id}
            productTitle={product.title}
            initialVariantId={selectedVariant.id}
          />
        )}
        
        {user && product && (
           <ProductForm 
          open={editOpen} 
          onClose={() => setEditOpen(false)} 
          onSuccess={fetchData} 
          product={product as any} 
          sellerId={product.sellerId} 
        />
        )}

        {product && (
          <VariantForm
            open={variantFormOpen}
            onClose={() => setVariantFormOpen(false)}
            onSuccess={fetchData}
            productId={product.id}
            variant={editingVariant}
            isService={product.isService}
          />
        )}
      </Container>
    </SellerLayout>
  );
}
