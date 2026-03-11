'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Typography, Button, Chip, Tab, Tabs,
  alpha, Paper, IconButton,
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BoltIcon from '@mui/icons-material/Bolt';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import GroupsIcon from '@mui/icons-material/Groups';
import ProductCard, { ProductCardProps } from '@/components/products/ProductCard';

// ─── Mock Data ─────────────────────────────────────────────────────────────
const mockProducts: ProductCardProps[] = [
  {
    id: '1', title: 'Facebook có 1000-5000 bạn bè và có nhiều bài đăng 2023-2025', slug: 'facebook-1000-5000-ban',
    price: 40000, priceMax: 280000, type: 'DIGITAL', categoryLabel: 'TÀI KHOẢN FB',
    seller: { username: 'lenhattuan', isVerified: true, isOnline: false, lastActive: '1 giờ trước' },
    viewCount: 444, soldCount: 4460, rating: 4.8, isSponsored: true,
  },
  {
    id: '2', title: 'Gmail tháng 8 2025 có 2FA+MKP hạn chế thư', slug: 'gmail-2025-2fa',
    price: 11999, type: 'DIGITAL', categoryLabel: 'GMAIL',
    seller: { username: 'truongphuchl', isVerified: true, isOnline: true },
    viewCount: 177, soldCount: 2120, rating: 4.9, isSponsored: true,
  },
  {
    id: '3', title: 'Tài khoản CapCut Pro cấp sẵn', slug: 'capcut-pro-cap-san',
    price: 1000, priceMax: 280000, type: 'DIGITAL', categoryLabel: 'TÀI KHOẢN CAPCUT',
    seller: { username: 'bearmedia', isOnline: true },
    viewCount: 374, soldCount: 442, rating: 4.6, isSponsored: true,
  },
  {
    id: '4', title: 'Tài khoản Twitter cổ từ 2006-2022', slug: 'twitter-co-2006-2022',
    price: 11000, priceMax: 30000, type: 'DIGITAL', categoryLabel: 'TÀI KHOẢN TWITTER',
    seller: { username: 'Tuandn', isOnline: false, lastActive: '7 giờ trước' },
    viewCount: 414, soldCount: 1, rating: 4.5,
  },
  {
    id: '5', title: 'Tài khoản Gmail Cổ-New-Gmail domain | Cho thuê gmail edu chỉ từ 58đ', slug: 'gmail-co-new-domain',
    price: 58, priceMax: 27000, type: 'DIGITAL', categoryLabel: 'GMAIL',
    seller: { username: '1trieumail', isVerified: true, isOnline: true },
    viewCount: 64879, soldCount: 10499, rating: 4.7,
  },
  {
    id: '6', title: 'Clone FB - VIA Việt 200x - 2026 | 2FA - VER HOTMAIL | Chất lượng cao', slug: 'clone-fb-via-viet-200x',
    price: 2300, priceMax: 16500, type: 'DIGITAL', categoryLabel: 'CLONE FB',
    seller: { username: '1trieumail', isVerified: true, isOnline: true },
    viewCount: 127679, soldCount: 22, rating: 4.3,
  },
  {
    id: '7', title: 'Gmail Edu cho thuê giá rẻ 24H', slug: 'gmail-edu-thue-24h',
    price: 49, priceMax: 999, type: 'DIGITAL', categoryLabel: 'GMAIL EDU',
    seller: { username: 'nvt1909', isVerified: false, isOnline: false, lastActive: '1 giờ trước' },
    viewCount: 1909, soldCount: 65664, rating: 4.6,
  },
  {
    id: '8', title: 'Chạy ADS Facebook, Google, Tiktok... - Tư vấn miễn phí', slug: 'chay-ads-fb-google',
    price: 1, priceMax: 100, type: 'SERVICE', categoryLabel: 'TƯƠNG TÁC',
    seller: { username: 'minhluong612', isOnline: true },
    viewCount: 0, soldCount: 125, rating: 4.8,
  },
  {
    id: '9', title: 'Tăng tương tác TikTok siêu nhanh - Hỗ trợ 24/7', slug: 'tang-tuong-tac-tiktok',
    price: 1000, priceMax: 6666, type: 'SERVICE', categoryLabel: 'TƯƠNG TÁC TIKTOK',
    seller: { username: 'trananhquan88', isVerified: true, isOnline: false, lastActive: '7 phút trước' },
    viewCount: 0, soldCount: 77, rating: 4.5,
  },
];

const banners = [
  {
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
    title: 'MUA BÁN AN TOÀN',
    subtitle: 'Cơ chế ESCROW bảo vệ 100%',
    desc: 'Tiền được tạm giữ 03 ngày bảo hành',
    cta: 'Xem sản phẩm',
    emoji: '🔒',
  },
  {
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #2563eb 100%)',
    title: 'NẠP TIỀN TỰ ĐỘNG',
    subtitle: 'Tích hợp SePay – 30 giây',
    desc: 'Quét QR mã – số dư cộng ngay tức thì',
    cta: 'Nạp tiền ngay',
    emoji: '⚡',
  },
  {
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 40%, #7c3aed 100%)',
    title: 'AI CHATBOT 24/7',
    subtitle: 'Hỗ trợ tức thì mọi lúc mọi nơi',
    desc: 'Tra cứu đơn hàng, tư vấn mua sắm thông minh',
    cta: 'Chat ngay',
    emoji: '🤖',
  },
];

const productCategories = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Email', value: 'email' },
  { label: 'Tài khoản', value: 'account' },
  { label: 'Key phần mềm', value: 'key' },
  { label: 'Tool & File', value: 'tool' },
  { label: 'Nâng cấp', value: 'upgrade' },
];

const serviceCategories = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Dịch vụ', value: 'service' },
  { label: 'Tăng tương tác', value: 'engagement' },
  { label: 'Marketing', value: 'marketing' },
];

const stats = [
  { label: 'Người dùng', value: '15,000+', icon: <GroupsIcon sx={{ fontSize: 28, color: '#16a34a' }} /> },
  { label: 'Sản phẩm', value: '850+', icon: <BoltIcon sx={{ fontSize: 28, color: '#16a34a' }} /> },
  { label: 'Giao dịch thành công', value: '50,000+', icon: <VerifiedUserIcon sx={{ fontSize: 28, color: '#16a34a' }} /> },
  { label: 'Hỗ trợ 24/7', value: 'AI + Agent', icon: <SupportAgentIcon sx={{ fontSize: 28, color: '#16a34a' }} /> },
];

export default function HomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [mainTab, setMainTab] = useState(0); // 0=all, 1=product, 2=service
  const [productCat, setProductCat] = useState('all');
  const [serviceCat, setServiceCat] = useState('all');

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, []);

  const displayedProducts = mainTab === 2
    ? mockProducts.filter((p) => p.type === 'SERVICE')
    : mainTab === 1
    ? mockProducts.filter((p) => p.type === 'DIGITAL')
    : mockProducts;

  return (
    <Box>
      {/* ─── Hero Banner ─*/}
      <Box sx={{ position: 'relative', overflow: 'hidden', height: { xs: 200, md: 260 } }}>
        {banners.map((b, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              inset: 0,
              background: b.gradient,
              opacity: i === bannerIdx ? 1 : 0,
              transition: 'opacity 0.7s ease',
              display: 'flex',
              alignItems: 'center',
              px: { xs: 3, md: 8 },
            }}
          >
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography sx={{ fontSize: { xs: '2.5rem', md: '4rem' } }}>{b.emoji}</Typography>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      fontSize: { xs: '1.3rem', md: '2rem' },
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {b.title}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: 'rgba(255,255,255,0.85)', fontSize: { xs: '0.9rem', md: '1.15rem' }, fontWeight: 600, mb: 0.5 }}
                  >
                    {b.subtitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2, display: { xs: 'none', md: 'block' } }}>
                    {b.desc}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: 'white',
                      color: '#16a34a',
                      fontWeight: 700,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                      px: 2,
                    }}
                  >
                    {b.cta}
                  </Button>
                </Box>
              </Box>
            </Container>
          </Box>
        ))}

        {/* Dots */}
        <Box sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.75 }}>
          {banners.map((_, i) => (
            <Box
              key={i}
              onClick={() => setBannerIdx(i)}
              sx={{
                width: i === bannerIdx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Nav arrows */}
        <IconButton
          onClick={() => setBannerIdx((p) => (p - 1 + banners.length) % banners.length)}
          sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}
          size="small"
        >
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton
          onClick={() => setBannerIdx((p) => (p + 1) % banners.length)}
          sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}
          size="small"
        >
          <NavigateNextIcon />
        </IconButton>
      </Box>

      <Container maxWidth="xl" sx={{ py: 0 }}>
        {/* ─── Stats ─*/}
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {stats.map((s, i) => (
            <Grid key={i} size={{ xs: 6, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  '&:hover': { borderColor: '#16a34a', boxShadow: '0 4px 16px rgba(22,163,74,0.1)' },
                  transition: 'all 0.25s ease',
                }}
              >
                <Box sx={{ mb: 1 }}>{s.icon}</Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ─── Featured Products Section ─*/}
        <Box
          sx={{
            mb: 6,
            p: 2.5,
            border: '1.5px solid',
            borderColor: '#16a34a',
            borderRadius: 3,
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WhatshotIcon sx={{ color: '#ef4444', fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Sản phẩm nổi bật
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ color: '#16a34a', fontWeight: 600, fontSize: '0.8rem' }}
            >
              Xem tất cả
            </Button>
          </Box>
          <Grid container spacing={1.5}>
            {mockProducts.filter((p) => p.isSponsored).slice(0, 4).map((p) => (
              <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <ProductCard {...p} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ─── Main Product Listing ─*/}
        <Box sx={{ bgcolor: 'white', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
          {/* Filter tabs */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            {/* Main type tabs */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { label: 'TẤT CẢ', val: 0 },
                { label: 'SẢN PHẨM', val: 1 },
                { label: 'DỊCH VỤ', val: 2 },
              ].map((t) => (
                <Button
                  key={t.val}
                  onClick={() => setMainTab(t.val)}
                  variant={mainTab === t.val ? 'contained' : 'outlined'}
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    px: 1.5,
                    borderRadius: 1.5,
                    ...(mainTab !== t.val && { borderColor: '#e2e8f0', color: 'text.secondary' }),
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </Box>

            {/* Sub categories */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {(mainTab !== 2 ? productCategories : serviceCategories).map((c) => {
                const active = mainTab !== 2 ? productCat === c.value : serviceCat === c.value;
                return (
                  <Chip
                    key={c.value}
                    label={`${c.label}${c.value !== 'all' ? ' (223)' : ''}`}
                    size="small"
                    onClick={() => mainTab !== 2 ? setProductCat(c.value) : setServiceCat(c.value)}
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.72rem',
                      bgcolor: active ? '#16a34a' : alpha('#16a34a', 0.06),
                      color: active ? 'white' : '#16a34a',
                      border: `1px solid ${active ? '#16a34a' : alpha('#16a34a', 0.2)}`,
                      '&:hover': { bgcolor: active ? '#15803d' : alpha('#16a34a', 0.12) },
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Results header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              mb: 2,
              bgcolor: '#16a34a',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
              📋 DANH SÁCH SẢN PHẨM
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Tìm thấy {displayedProducts.length} sản phẩm
            </Typography>
          </Box>

          {/* Product Grid */}
          <Grid container spacing={1.5}>
            {displayedProducts.map((p) => (
              <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3, lg: 3 }}>
                <ProductCard {...p} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ─── Escrow Info Section ─*/}
        <Box
          sx={{
            mt: 4,
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, color: '#15803d' }}>
            🔒 Mua sắm an tâm với cơ chế Escrow
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
            Tiền của bạn được bảo vệ 100% – Không nhận hàng, không mất tiền
          </Typography>
          <Grid container spacing={2}>
            {[
              { step: '1', title: 'Bạn thanh toán', desc: 'Tiền được tạm giữ bởi MarketMMO, KHÔNG chuyển ngay cho người bán.', color: '#16a34a' },
              { step: '2', title: 'Nhận hàng & kiểm tra', desc: 'Người bán giao hàng. Bạn có 03 ngày để kiểm tra chất lượng.', color: '#0284c7' },
              { step: '3', title: 'Hoàn tất / Khiếu nại', desc: 'Nếu hài lòng, tiền chuyển cho seller. Có vấn đề? Bấm Khiếu nại ngay.', color: '#7c3aed' },
            ].map((s, i) => (
              <Grid key={i} size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: s.color,
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {s.step}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{s.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {s.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
