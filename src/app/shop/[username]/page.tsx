'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Typography, Avatar, Grid, Paper,
  Chip, Skeleton, Button, Stack
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';

interface SellerData {
  id: string;
  username: string;
  avatar: string | null;
  level: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    sellerOrders: number;
  };
}

interface ProductData {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceMax: number | null;
  type: string;
  thumbnail: string | null;
  soldCount: number;
  viewCount: number;
}

export default function ShopDetailPage() {
  const params = useParams();
  const [data, setData] = useState<{ seller: SellerData; products: ProductData[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.username) return;
    fetch(`/api/shop/${params.username}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.username]);

  if (loading) {
    return (
      <SiteLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rounded" height={220} sx={{ mb: 6, borderRadius: 5 }} />
          <Skeleton variant="rounded" height={80} sx={{ mb: 6, borderRadius: 4 }} />
          <Grid container spacing={4}>
            {[1, 2, 3, 4].map(i => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </SiteLayout>
    );
  }

  if (!data?.seller) {
    return (
      <SiteLayout>
        <Container sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Không tìm thấy gian hàng này</Typography>
          <Button 
            component={Link} 
            href="/" 
            variant="contained" 
            disableElevation
            sx={{ 
              bgcolor: '#4cc752', 
              px: 6, 
              py: 1.5,
              borderRadius: 3, 
              fontWeight: 800,
              fontSize: '1rem',
              '&:hover': { bgcolor: '#15803d' } 
            }}
          >
            Về trang chủ
          </Button>
        </Container>
      </SiteLayout>
    );
  }

  const { seller, products } = data;
  const joinDate = new Date(seller.createdAt).toLocaleDateString('vi-VN');

  return (
    <SiteLayout>
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 12 }}>
        {/* Shop Header Banner */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
            pt: { xs: 6, md: 7 }, 
            pb: { xs: 12, md: 10 },
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              bgcolor: '#f8fafc',
              zIndex: 0
            }
          }} 
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 6, 
                bgcolor: 'white',
                position: 'relative',
                boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                border: '1px solid #f1f5f9'
              }}
            >
              {/* Decorative side bar */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 8, bgcolor: '#4cc752' }} />
              
              <Grid container spacing={5} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ display: 'flex', gap: { xs: 4, md: 5 }, alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar 
                        src={seller.avatar ?? undefined} 
                        variant="rounded"
                        sx={{ 
                          width: { xs: 90, md: 140 }, 
                          height: { xs: 90, md: 140 }, 
                          bgcolor: '#fde047',
                          borderRadius: 4,
                          boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                          border: '4px solid white'
                        }}
                      >
                        <StorefrontIcon sx={{ fontSize: { xs: '3.5rem', md: '4.5rem' }, color: 'white' }} />
                      </Avatar>
                      <Box 
                        sx={{ 
                          position: 'absolute', bottom: -8, right: -8, 
                          bgcolor: 'white', borderRadius: '50%', p: 0.8,
                          boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <VerifiedUserIcon sx={{ color: '#4cc752', fontSize: 28 }} />
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                          {seller.username}
                        </Typography>
                        <Chip 
                          label={`Level ${seller.level}`} 
                          sx={{ 
                            bgcolor: '#4cc752', 
                            color: 'white', 
                            fontWeight: 900, 
                            fontSize: '0.85rem',
                            height: 28,
                            px: 1.5,
                            borderRadius: 1.5
                          }} 
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.6, bgcolor: seller.isActive ? '#ecfdf5' : '#f8fafc', borderRadius: 10, border: `1px solid ${seller.isActive ? '#d1fae5' : '#e2e8f0'}` }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: seller.isActive ? '#10b981' : '#94a3b8', animation: seller.isActive ? 'pulse 2s infinite' : 'none' }} />
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: seller.isActive ? '#059669' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {seller.isActive ? 'Online' : 'Offline'}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Typography variant="body2" sx={{ color: '#475569', mb: 2.5, maxWidth: 600, lineHeight: 1.6, fontWeight: 500, fontSize: '0.95rem' }}>
                        Chào mừng đến với gian hàng của <strong>{seller.username}</strong>. Chúng tôi chuyên cung cấp giải pháp, sản phẩm và dịch vụ số hàng đầu, 
                        đảm bảo uy tín tuyệt đối và hỗ trợ khách hàng nhanh chóng nhất.
                      </Typography>
                      
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 6, sm: 4, md: "auto" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, bgcolor: '#fff7ed', borderRadius: 2, display: 'flex' }}>
                              <CalendarMonthIcon sx={{ fontSize: 22, color: '#f59e0b' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Tham gia</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>{joinDate}</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: "auto" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 2, display: 'flex' }}>
                              <ShoppingBagIcon sx={{ fontSize: 22, color: '#16a34a' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Đã bán</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>{seller._count.sellerOrders}</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4, md: "auto" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, bgcolor: '#fef2f2', borderRadius: 2, display: 'flex' }}>
                              <FavoriteIcon sx={{ fontSize: 22, color: '#ef4444' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Yêu thích</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>12</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: 'right' } }}>
                  <Button 
                    variant="contained" 
                    disableElevation
                    startIcon={<ChatIcon />}
                    sx={{ 
                      bgcolor: '#4cc752', 
                      color: 'white', 
                      fontWeight: 900,
                      px: 6,
                      py: 2.2,
                      fontSize: '1.1rem',
                      borderRadius: 4,
                      boxShadow: '0 12px 30px rgba(76,199,82,0.35)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        bgcolor: '#15803d',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 40px rgba(21,128,61,0.45)',
                      }
                    }}
                  >
                    Đăng nhập để chat
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 10 }}>
          {/* Shop Section Header */}
          <Paper
            elevation={0}
            sx={{ 
              borderRadius: 5, 
              p: { xs: 3, md: 4 }, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 15px 35px rgba(0,0,0,0.06)',
              mb: 6,
              border: '1px solid #e2e8f0',
              bgcolor: 'white'
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ bgcolor: '#f0fdf4', p: 2, borderRadius: 3, display: 'flex' }}>
                <StorefrontIcon sx={{ color: '#16a34a', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 900, lineHeight: 1.2, mb: 0.5 }}>
                  Danh sách sản phẩm
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Tất cả sản phẩm đang được bày bán bởi {seller.username}
                </Typography>
              </Box>
            </Stack>
            
            <Chip 
              icon={<ShoppingBagIcon sx={{ fontSize: 18, color: '#16a34a !important' }} />}
              label={`${products.length} sản phẩm`} 
              sx={{ 
                bgcolor: '#f0fdf4', 
                color: '#16a34a', 
                fontWeight: 900,
                border: '1px solid #dcfce7',
                px: 2,
                height: 36,
                borderRadius: 2
              }}
            />
          </Paper>

          {products.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 12, 
                textAlign: 'center', 
                borderRadius: 6, 
                bgcolor: 'white', 
                border: '2px dashed #e2e8f0' 
              }}
            >
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <ShoppingBagIcon sx={{ fontSize: 80, color: '#e2e8f0' }} />
              </Box>
              <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 800, mb: 1 }}>
                Kho hàng đang trống
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Người bán hiện đang chuẩn bị hàng mới, vui lòng quay lại sau ít phút!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={4}>
              {products.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.id}>
                  <ProductCard
                    id={p.id}
                    title={p.title}
                    slug={p.slug}
                    price={p.price}
                    priceMax={p.priceMax ?? undefined}
                    type={p.type as "DIGITAL" | "SERVICE"}
                    thumbnail={p.thumbnail ?? undefined}
                    soldCount={p.soldCount}
                    viewCount={p.viewCount}
                    seller={{
                      username: seller.username,
                      isOnline: seller.isActive
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </SiteLayout>
  );
}
