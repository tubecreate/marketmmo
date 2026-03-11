'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Grid, Paper, Typography, Button, Chip,
  Divider, Skeleton, Breadcrumbs, Link as MuiLink,
  IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import SyncIcon from '@mui/icons-material/Sync';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LoginIcon from '@mui/icons-material/Login';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Variant { id: string; name: string; price: number; description?: string | null; _count?: { items: number }; }

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [orderResult, setOrderResult] = useState<Record<string, unknown> | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVar, setSelectedVar] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!params.slug) return;
    const slug = params.slug as string;

    // Fetch product and variants in parallel
    Promise.all([
      fetch(`/api/products/${slug}`).then(r => r.json()),
    ]).then(async ([data]) => {
      if (data.error) { router.push('/404'); return; }
      setProduct(data);

      // Fetch variants for this product
      try {
        const vRes = await fetch(`/api/products/${data.id}/variants`);
        const vData = await vRes.json();
        const varList: Variant[] = vData.variants || [];
        setVariants(varList);
        if (varList.length > 0) setSelectedVar(varList[0]);
      } catch { /* no variants */ }

      setLoading(false);
    }).catch(() => router.push('/404'));
  }, [params.slug, router]);

  const handleBuy = async () => {
    if (!user || !product || !selectedVar) return;
    setBuying(true);
    setBuyError('');
    try {
      const uid = user.id;
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: uid,
          productId: product.id as string,
          variantId: selectedVar.id,
          quantity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderResult(data.order);
        // Refresh variant stock counts
        const vRes = await fetch(`/api/products/${product.id}/variants`);
        const vData = await vRes.json();
        setVariants(vData.variants || []);
        setQuantity(1);
      } else {
        setBuyError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setBuyError('Lỗi kết nối server');
    } finally {
      setBuying(false);
    }
  };

  const selectedStock = selectedVar?._count?.items ?? 0;

  const handleQtyChange = (type: 'sub' | 'add') => {
    if (type === 'sub' && quantity > 1) setQuantity(q => q - 1);
    if (type === 'add' && quantity < selectedStock) setQuantity(q => q + 1);
  };

  if (loading) {
    return (
      <SiteLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rounded" height={40} width={300} sx={{ mb: 3 }} />
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}><Skeleton variant="rounded" height={400} /></Grid>
            <Grid size={{ xs: 12, md: 7 }}><Skeleton variant="rounded" height={600} /></Grid>
          </Grid>
        </Container>
      </SiteLayout>
    );
  }

  if (!product) return null;

  const displayPrice = selectedVar ? selectedVar.price : (product.price as number);
  const totalStock = variants.length > 0
    ? variants.reduce((s, v) => s + (v._count?.items ?? 0), 0)
    : ((product._count as Record<string, number>)?.items || 0);

  return (
    <SiteLayout>
      <Box sx={{ bgcolor: '#f8fafc', py: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <MuiLink component={Link} href="/" color="inherit" sx={{ fontSize: '0.875rem' }}>Trang chủ</MuiLink>
            <MuiLink component={Link} href="/san-pham" color="inherit" sx={{ fontSize: '0.875rem' }}>{(product.category as Record<string,string>)?.name || 'Sản phẩm'}</MuiLink>
            <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>{product.title as string}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* LEFT: Image */}
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
              <Box sx={{ position: 'absolute', top: 12, left: 0, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1.5, py: 0.5, borderTopRightRadius: 4, borderBottomRightRadius: 4, fontSize: '0.75rem', fontWeight: 700, zIndex: 2 }}>
                KHO MARKETMMO
              </Box>
              <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: '#1e293b' }}>
                {product.thumbnail ? (
                  <Box component="img" src={product.thumbnail as string} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>
                    📦
                  </Box>
                )}
                <IconButton onClick={() => setIsFavorite(!isFavorite)}
                  sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                >
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon sx={{ color: '#64748b' }} />}
                </IconButton>
              </Box>
            </Box>

            <Button fullWidth variant="outlined" startIcon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              onClick={() => setIsFavorite(!isFavorite)}
              sx={{ mb: 3, py: 1, borderColor: 'divider', color: 'text.secondary', bgcolor: 'white', '&:hover': { bgcolor: '#f8fafc' } }}
            >
              {isFavorite ? 'Đã yêu thích' : 'Thêm sản phẩm yêu thích'}
            </Button>

            <Box sx={{ p: 2, bgcolor: '#fefce8', border: '1px solid #fef08a', borderRadius: 2, display: 'flex', gap: 1 }}>
              <WarningAmberIcon sx={{ color: '#ca8a04', fontSize: 20, mt: 0.2 }} />
              <Typography variant="body2" sx={{ color: '#854d0e', fontSize: '0.85rem' }}>
                <strong>Lưu ý:</strong> Khách hàng nên xem kỹ chế độ bảo hành hoặc nhắn tin cho người bán trước khi mua để đảm bảo quyền lợi.
              </Typography>
            </Box>
          </Grid>

          {/* RIGHT: Details & Purchase */}
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>

              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ea580c', mb: 2, textTransform: 'uppercase', lineHeight: 1.4 }}>
                {product.title as string}
              </Typography>

              {/* Price — shows selected variant price */}
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626', mb: 2 }}>
                {displayPrice.toLocaleString('vi-VN')} VNĐ
              </Typography>

              {/* Stats row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1.5, fontSize: '0.85rem', color: '#64748b' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                  {'★'.repeat(5)} <Typography component="span" sx={{ ml: 0.5, color: '#64748b', fontSize: '0.85rem' }}>(5 đánh giá)</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Kho: <strong>{selectedVar ? selectedStock : totalStock}</strong>
                  <SyncIcon sx={{ fontSize: 14, color: '#0ea5e9' }} />
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                <Typography variant="body2">Đã bán: <strong>{product.soldCount as number}</strong></Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Người bán:</Typography>
                <Chip
                  icon={<ChatIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />}
                  label={(product.seller as Record<string, string>)?.username}
                  size="small"
                  sx={{ bgcolor: 'transparent', color: '#16a34a', fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }}
                />
                <Typography variant="caption" color="text.secondary">• {(product.seller as Record<string, boolean>)?.isActive ? 'Online ngay lúc này' : 'Offline'}</Typography>
              </Box>

              <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

              {/* ── VARIANTS ── */}
              {variants.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '.08em' }}>
                    Chọn gói
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {variants.map(v => {
                      const stock = v._count?.items ?? 0;
                      const isSelected = selectedVar?.id === v.id;
                      const outOfStock = stock === 0;
                      return (
                        <Box
                          key={v.id}
                          onClick={() => { if (!outOfStock) { setSelectedVar(v); setQuantity(1); } }}
                          sx={{
                            p: 1.5, border: '1px solid',
                            borderColor: isSelected ? '#fde047' : outOfStock ? '#f1f5f9' : '#e2e8f0',
                            bgcolor: isSelected ? '#fef9c3' : outOfStock ? '#f8fafc' : 'white',
                            borderRadius: 1,
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            opacity: outOfStock ? 0.55 : 1,
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            '&:hover': !outOfStock ? { borderColor: '#fcd34d', bgcolor: '#fef3c7' } : {},
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: isSelected ? '#854d0e' : '#475569', textTransform: 'uppercase' }}>
                              {v.name}
                            </Typography>
                            {v.description && (
                              <Typography variant="caption" color="text.secondary">{v.description}</Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                              {v.price.toLocaleString('vi-VN')}đ
                            </Typography>
                            <Typography variant="caption" sx={{ color: stock > 0 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                              {outOfStock ? 'Hết hàng' : `${stock} còn lại`}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Quantity */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>SỐ LƯỢNG</Typography>
                <Box sx={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 1, overflow: 'hidden' }}>
                  <Button onClick={() => handleQtyChange('sub')} sx={{ minWidth: 40, p: 0, color: '#475569', bgcolor: '#f8fafc', borderRadius: 0 }}>-</Button>
                  <Box sx={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', fontWeight: 700 }}>
                    {quantity}
                  </Box>
                  <Button onClick={() => handleQtyChange('add')} sx={{ minWidth: 40, p: 0, color: '#475569', bgcolor: '#f8fafc', borderRadius: 0 }}>+</Button>
                </Box>
                {selectedVar && (
                  <Typography variant="body2" color="text.secondary">
                    Tổng: <strong style={{ color: '#dc2626' }}>{(selectedVar.price * quantity).toLocaleString('vi-VN')}đ</strong>
                  </Typography>
                )}
              </Box>

              {/* Buy CTA */}
              {buyError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: '0.85rem' }}>
                  {buyError}
                </Alert>
              )}
              {!user ? (
                <>
                  <Box sx={{ p: 2, bgcolor: '#fefce8', borderRadius: 1, mb: 2, display: 'flex', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#ca8a04', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#854d0e' }}>
                      Bạn cần <strong>đăng nhập</strong> để mua sản phẩm này
                    </Typography>
                  </Box>
                  <Button fullWidth variant="contained" size="large" component={Link} href="/dang-nhap"
                    startIcon={<LoginIcon />}
                    sx={{ bgcolor: '#eab308', color: '#854d0e', fontWeight: 800, fontSize: '1.1rem', py: 1.5, borderRadius: 1, '&:hover': { bgcolor: '#ca8a04' } }}
                  >
                    Đăng nhập ngay
                  </Button>
                </>
              ) : (
                <Button
                  fullWidth variant="contained" size="large" onClick={handleBuy}
                  disabled={buying || product.status !== 'ACTIVE' || selectedStock === 0}
                  startIcon={buying ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                  sx={{ bgcolor: '#eab308', color: '#854d0e', fontWeight: 800, fontSize: '1.1rem', py: 1.5, borderRadius: 1, '&:hover': { bgcolor: '#ca8a04' } }}
                >
                  {selectedStock === 0 ? 'HẾT HÀNG' : buying ? 'ĐANG XỬ LÝ...' : 'MUA NGAY'}
                </Button>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 4, mt: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>MÔ TẢ SẢN PHẨM</Typography>
              <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {product.description as string || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* ── Receipt Dialog ── */}
      <Dialog
        open={Boolean(orderResult)}
        onClose={() => setOrderResult(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ fontSize: '3rem', mb: 1 }}>🎉</Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>Mua Hàng Thành Công!</Typography>
          <Typography variant="body2" color="text.secondary">
            Mã đơn hàng: <strong style={{ color: '#0f172a' }}>#{orderResult?.id?.toString().slice(-8).toUpperCase()}</strong>
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Sản phẩm:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.title as string}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Phân loại:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{orderResult?.variantName as string}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{orderResult?.quantity as React.ReactNode}</Typography>
            </Box>
            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tổng thanh toán:</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                {(orderResult?.amount as number)?.toLocaleString('vi-VN')}đ
              </Typography>
            </Box>
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            THÔNG TIN TÀI KHOẢN ĐÃ GIAO:
            <Button
              size="small"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={() => {
                navigator.clipboard.writeText(orderResult?.deliveredContent as string);
                alert('Đã sao chép vào bộ nhớ tạm');
              }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0284c7' }}
            >
              Copy Toàn Bộ
            </Button>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={orderResult?.deliveredContent as string}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: '#fffbeb', borderRadius: 2 }
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#854d0e', textAlign: 'center' }}>
            * Thông tin này cũng được lưu trong mục Quản lý đơn hàng của bạn.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            disableElevation
            onClick={() => { setOrderResult(null); router.push('/tai-khoan/don-hang'); }}
            sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 1.5, bgcolor: '#0f172a', '&:hover': { bgcolor: '#334155' } }}
          >
            Đến Quản Lý Đơn Hàng
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOrderResult(null)}
            sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 1.5, color: '#475569', borderColor: '#cbd5e1' }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </SiteLayout>
  );
}
