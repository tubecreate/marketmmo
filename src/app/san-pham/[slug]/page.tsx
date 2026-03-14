'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Grid, Paper, Typography, Button, Chip,
  Divider, Skeleton, Breadcrumbs, Link as MuiLink,
  IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField,
  Rating, Avatar, Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InventoryIcon from '@mui/icons-material/Inventory';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import SyncIcon from '@mui/icons-material/Sync';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LoginIcon from '@mui/icons-material/Login';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/auth/LoginModal';

interface Variant { id: string; name: string; price: number; allowBidding: boolean; deliveryTimeHours: number | null; description?: string | null; _count?: { items: number }; }

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVar, setSelectedVar] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

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

      // Fetch reviews
      try {
        const rRes = await fetch(`/api/reviews?productId=${data.id}`);
        const rData = await rRes.json();
        setReviews(Array.isArray(rData) ? rData : []);
      } catch { /* no reviews */ }
      setReviewsLoading(false);

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
        setOrderResult({ ...data.order, preOrder: data.preOrder || false });
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
    // Allow increasing quantity for pre-orders (selectedStock === 0) up to 100
    if (type === 'add') {
      if (selectedStock > 0 && quantity < selectedStock) {
        setQuantity(q => q + 1);
      } else if (selectedStock === 0 && quantity < 100) {
        setQuantity(q => q + 1);
      }
    }
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
            <MuiLink component={Link} href="/san-pham" color="inherit" sx={{ fontSize: '0.875rem' }}>{(product.category as Record<string,string>)?.name || 'Gian hàng'}</MuiLink>
            <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>{String(product.title || '')}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* LEFT: Image */}
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
              {/* Removed KHO MARKETMMO tag as requested */}
              <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: '#1e293b' }}>
                {product.thumbnail ? (
                  <Box component="img" src={product.thumbnail as string} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>
                    📦
                  </Box>
                )}
                <IconButton onClick={() => setIsFavorite(!isFavorite)}
                  sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.9)', zIndex: 3, '&:hover': { bgcolor: 'white' } }}
                >
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon sx={{ color: '#64748b' }} />}
                </IconButton>
              </Box>
              {product.status === 'CLOSED' && (
                <Box sx={{ 
                  position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', 
                  zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)'
                }}>
                  <Typography sx={{ 
                    bgcolor: '#ef4444', color: 'white', px: 3, py: 1.5, 
                    borderRadius: 2, fontWeight: 900, fontSize: '1.2rem',
                    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.5)',
                    transform: 'rotate(-5deg)',
                    border: '2px solid white'
                  }}>
                    GIAN HÀNG TẠM ĐÓNG
                  </Typography>
                </Box>
              )}
            </Box>

            <Button fullWidth variant="outlined" startIcon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              onClick={() => setIsFavorite(!isFavorite)}
              sx={{ mb: 3, py: 1, borderColor: 'divider', color: 'text.secondary', bgcolor: 'white', '&:hover': { bgcolor: '#f8fafc' } }}
            >
              {isFavorite ? 'Đã yêu thích' : 'Thêm gian hàng yêu thích'}
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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ color: product.isService ? '#f59e0b' : (product.type === 'DIGITAL' ? '#4cc752' : '#7c3aed'), fontWeight: 800, fontSize: '0.65rem', letterSpacing: 0.8, textTransform: 'uppercase', bgcolor: product.isService ? '#fef3c7' : (product.type === 'DIGITAL' ? '#f0fdf4' : '#f3e8ff'), px: 1, py: 0.5, borderRadius: 1 }}>
                  {product.isService ? 'DỊCH VỤ' : (product.type === 'DIGITAL' ? 'SẢN PHẨM SỐ' : 'DỊCH VỤ TÀI KHOẢN')}
                </Typography>
                {product.isService && product.deliveryTimeHours && (
                  <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700, bgcolor: '#e0f2fe', px: 1, py: 0.5, borderRadius: 1 }}>
                    ⏳ GIAO TRONG {product.deliveryTimeHours} GIỜ
                  </Typography>
                )}
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, textTransform: 'uppercase', lineHeight: 1.4 }}>
                {String(product.title || '')}
              </Typography>

              {/* Price — shows selected variant price or "Thoả thuận" */}
              <Typography variant="h4" sx={{ fontWeight: 800, color: (product.isService && (product.allowBidding || selectedVar?.allowBidding)) ? '#ef4444' : '#16a34a', mb: 2 }}>
                {(product.isService && (product.allowBidding || selectedVar?.allowBidding)) ? 'Thỏa thuận' : `${displayPrice.toLocaleString('vi-VN')} VNĐ`}
              </Typography>

              {/* Stats row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1.5, fontSize: '0.85rem', color: '#64748b' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: '#f59e0b', gap: 0.5 }}>
                  <Rating value={Number(product.rating) || 0} precision={0.5} readOnly size="small" sx={{ color: '#f59e0b' }} />
                  <Typography component="span" sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                    ({(product._count as any)?.orders || 0} đánh giá)
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Kho: <strong>{selectedVar ? selectedStock : totalStock}</strong>
                  <SyncIcon sx={{ fontSize: 14, color: '#0ea5e9' }} />
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                <Typography variant="body2">Đã bán: <strong>{product.soldCount as number}</strong></Typography>
              </Box>

              {product.shortDescription && (
                <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, borderLeft: '4px solid #16a34a' }}>
                  <Typography variant="body2" sx={{ color: '#166534', lineHeight: 1.6, fontWeight: 500 }}>
                    {product.shortDescription as string}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Người bán:</Typography>
                <Chip
                  icon={<ChatIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />}
                  label={(product.seller as Record<string, string>)?.username}
                  size="small"
                  sx={{ bgcolor: 'transparent', color: '#16a34a', fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }}
                />
                <Typography variant="caption" color="text.secondary">• {(product.seller as Record<string, boolean>)?.isActive ? 'Online ngay lúc này' : 'Offline'}</Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', display: { xs: 'none', sm: 'block' } }} />
                <Button
                  component={Link}
                  href={`/shop/${(product.seller as Record<string, string>)?.username}`}
                  size="small"
                  variant="outlined"
                  startIcon={<StorefrontIcon sx={{ fontSize: '16px !important' }} />}
                  sx={{ 
                    borderRadius: '8px',
                    borderColor: '#ff4d4f',
                    color: '#ff4d4f',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 1.5,
                    '&:hover': {
                      borderColor: '#ff7875',
                      bgcolor: 'rgba(255, 77, 79, 0.04)'
                    }
                  }}
                >
                  Xem Shop
                </Button>
              </Box>

              <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

              {/* ── VARIANTS ── */}
              {variants.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '.08em' }}>
                    Chọn sản phẩm
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {variants.map(v => {
                      const stock = v._count?.items ?? 0;
                      const isSelected = selectedVar?.id === v.id;
                      const outOfStock = stock === 0;
                      return (
                        <Box
                          key={v.id}
                          onClick={() => { setSelectedVar(v); setQuantity(1); }}
                          sx={{
                            p: 1.5, border: '1px solid',
                            borderColor: isSelected ? '#16a34a' : outOfStock ? '#e2e8f0' : '#e2e8f0',
                            bgcolor: isSelected ? '#f0fdf4' : 'white',
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' },
                            position: 'relative'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: isSelected ? '#166534' : '#475569', textTransform: 'uppercase' }}>
                              {v.name}
                            </Typography>
                            {v.description && (
                              <Typography variant="caption" color="text.secondary">{v.description}</Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: (product.isService && (product.allowBidding || v.allowBidding)) ? '#ea580c' : '#15803d' }}>
                              {(product.isService && (product.allowBidding || v.allowBidding)) ? 'Thoả thuận' : `${v.price.toLocaleString('vi-VN')}đ`}
                            </Typography>
                            {!(product.isService && (product.allowBidding || v.allowBidding)) && (
                              <Typography variant="caption" sx={{ color: stock > 0 ? '#16a34a' : '#ea580c', fontWeight: 600 }}>
                                {stock > 0 ? `${stock} còn lại` : '⏳ Đặt trước'}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Quantity (Hidden if Bidding is enabled) */}
              {!(product.isService && (product.allowBidding || selectedVar?.allowBidding)) && (
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
                      Tổng: <strong style={{ color: '#16a34a' }}>{(selectedVar.price * quantity).toLocaleString('vi-VN')}đ</strong>
                    </Typography>
                  )}
                </Box>
              )}

              {/* Buy CTA */}
              {product.status === 'CLOSED' && (
                <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 1, fontWeight: 700 }}>
                  Gian hàng hiện đang đóng cửa tạm thời. Vui lòng quay lại sau!
                </Alert>
              )}
              {buyError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: '0.85rem' }}>
                  {buyError}
                </Alert>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#64748b', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    THỜI GIAN GIAO: <span style={{ color: '#1e293b' }}>{selectedVar?.deliveryTimeHours || product.deliveryTimeHours || 'Thỏa thuận'} GIỜ</span>
                  </Typography>
                </Box>
              {!user ? (
                <>
                  <Box sx={{ p: 2, bgcolor: '#fefce8', borderRadius: 1, mb: 2, display: 'flex', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#ca8a04', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#854d0e' }}>
                      Bạn cần <strong>đăng nhập</strong> để mua hàng
                    </Typography>
                  </Box>
                  <Button fullWidth variant="contained" size="large"
                    startIcon={<LoginIcon />}
                    onClick={() => setLoginOpen(true)}
                    sx={{ bgcolor: '#eab308', color: '#854d0e', fontWeight: 800, fontSize: '1.1rem', py: 1.5, borderRadius: 1, '&:hover': { bgcolor: '#ca8a04' } }}
                  >
                    Đăng nhập ngay
                  </Button>
                  <LoginModal 
                    open={loginOpen} 
                    onClose={() => setLoginOpen(false)} 
                    onSuccess={() => {
                        // Success is handled by context change
                    }}
                  />
                </>
              ) : (
                <Button
                  fullWidth variant="contained" size="large" onClick={handleBuy}
                  disabled={buying || product.status === 'CLOSED'}
                  startIcon={buying ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                  sx={{ 
                    bgcolor: (product.isService && (product.allowBidding || selectedVar?.allowBidding)) ? '#ef4444' : (selectedStock === 0 && !product.isService ? '#1e293b' : '#16a34a'), 
                    color: 'white', 
                    fontWeight: 800, fontSize: '1.1rem', py: 1.5, borderRadius: 1, 
                    '&:hover': { bgcolor: (product.isService && (product.allowBidding || selectedVar?.allowBidding)) ? '#dc2626' : (selectedStock === 0 && !product.isService ? '#334155' : '#15803d') } 
                  }}
                >
                  {product.status === 'CLOSED' ? 'TẠM NGƯNG' : buying ? 'ĐANG XỬ LÝ...' : (product.isService && (product.allowBidding || selectedVar?.allowBidding)) ? '💬 TẠO ĐƠN THƯƠNG LƯỢNG' : selectedStock === 0 && !product.isService ? '⏳ ĐẶT TRƯỚC NGAY' : 'MUA NGAY'}
                </Button>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 4, mt: 4, borderRadius: 3, border: '1px solid', borderColor: '#e2e8f0', bgcolor: 'white' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                MÔ TẢ CHI TIẾT
              </Typography>
              <Divider sx={{ mb: 3, borderColor: '#f1f5f9' }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#334155', 
                  lineHeight: 1.9, 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.95rem'
                }}
              >
                {product.description as string || 'Chưa có mô tả chi tiết cho gian hàng này.'}
              </Typography>
            </Paper>

            {/* ── REVIEWS SECTION ── */}
            <Paper elevation={0} sx={{ p: 4, mt: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>ĐÁNH GIÁ TỪ KHÁCH HÀNG</Typography>
                {reviews.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>{Number(product.rating || 0).toFixed(1)}</Typography>
                    <Box>
                      <Rating value={Number(product.rating || 0)} precision={0.1} readOnly size="small" />
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                        {reviews.length} nhận xét
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {reviewsLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>
              ) : reviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">Chưa có đánh giá nào cho gian hàng này.</Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {reviews.map((rev: any) => (
                    <Box key={rev.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: '#f1f5f9', color: '#475569' }}>
                            {rev.order.buyer.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                              {rev.order.buyer.username}
                            </Typography>
                            <Rating value={rev.rating} size="small" readOnly sx={{ fontSize: '0.75rem', mt: 0.5 }} />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', ml: 6 }}>
                        {rev.comment || <i>Khách hàng không để lại nhận xét.</i>}
                      </Typography>
                      
                      {rev.sellerReply && (
                        <Box sx={{ ml: 6, mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, borderLeft: '3px solid #16a34a' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', display: 'block', mb: 0.5 }}>
                            Phản hồi từ người bán
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                            {rev.sellerReply}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ mt: 3 }} />
                    </Box>
                  ))}
                </Stack>
              )}
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
          <Box sx={{ fontSize: '3rem', mb: 1 }}>{orderResult?.preOrder ? '⏳' : '🎉'}</Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: orderResult?.preOrder ? '#d97706' : '#16a34a' }}>
            {orderResult?.preOrder ? 'Đặt Trước Thành Công!' : (orderResult?.status === 'NEGOTIATING' ? 'Tạo Đơn Thành Công!' : 'Mua Hàng Thành Công!')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mã đơn hàng: <strong style={{ color: '#0f172a' }}>#{orderResult?.id?.toString().slice(-8).toUpperCase()}</strong>
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Gian hàng:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(product.title || '')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Sản phẩm:</Typography>
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

          {orderResult?.preOrder ? (
            <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
              <strong>Đơn đặt trước</strong> — Hàng sẽ được giao tự động khi người bán nhập kho. 
              Bạn có thể huỷ đặt trước bất kỳ lúc nào trong trang Quản lý đơn hàng.
            </Alert>
          ) : orderResult?.status === 'NEGOTIATING' ? (
            <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
              <strong>Đang thương lượng</strong> — Đơn hàng đã được tạo. Bạn hãy vào trang chi tiết đơn hàng để đàm phán giá với người bán. Tiền trong ví chưa bị trừ.
            </Alert>
          ) : orderResult?.status === 'PENDING_ACCEPTANCE' && product.isService ? (
            <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
              <strong>Chờ xác nhận</strong> — Đơn đặt hàng dịch vụ thành công! Tiền của bạn đang được tạm giữ an toàn. Vui lòng chờ người bán bắt đầu công việc.
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                THÔNG TIN TÀI KHOẢN ĐÃ GIAO:
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={() => {
                    navigator.clipboard.writeText(orderResult?.deliveredContent as string);
                    toast.success('Đã sao chép vào bộ nhớ tạm');
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
            </>
          )}
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
