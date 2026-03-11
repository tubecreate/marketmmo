'use client';
import React from 'react';
import Link from 'next/link';
import {
  Box, Container, Grid, Typography, Divider, IconButton,
  alpha, Stack,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FacebookIcon from '@mui/icons-material/Facebook';
import TelegramIcon from '@mui/icons-material/Telegram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VerifiedIcon from '@mui/icons-material/Verified';

const footerLinks = {
  company: [
    { label: 'Giới thiệu', href: '/gioi-thieu' },
    { label: 'Chính sách bảo mật', href: '/chinh-sach-bao-mat' },
    { label: 'Điều khoản sử dụng', href: '/dieu-khoan' },
    { label: 'Phí sàn & Hoa hồng', href: '/phi-san' },
    { label: 'Tin tức & Blog', href: '/tin-tuc' },
  ],
  buyer: [
    { label: 'Hướng dẫn mua hàng', href: '/huong-dan/mua-hang' },
    { label: 'Nạp tiền tự động', href: '/tai-khoan/nap-tien' },
    { label: 'Tra cứu đơn hàng', href: '/tai-khoan/don-hang' },
    { label: 'Khiếu nại đơn hàng', href: '/huong-dan/khieu-nai' },
    { label: 'Câu hỏi thường gặp', href: '/faq' },
  ],
  seller: [
    { label: 'Đăng ký bán hàng', href: '/dang-ky-ban-hang' },
    { label: 'Hướng dẫn đăng bán', href: '/huong-dan/dang-ban' },
    { label: 'Quy định sản phẩm', href: '/quy-dinh-san-pham' },
    { label: 'Yêu cầu rút tiền', href: '/ban-hang/rut-tien' },
    { label: 'Tài liệu tích hợp API', href: '/docs/api' },
  ],
};

const trustBadges = [
  { icon: <SecurityIcon sx={{ fontSize: 20, color: '#16a34a' }} />, label: 'Bảo vệ Escrow' },
  { icon: <SupportAgentIcon sx={{ fontSize: 20, color: '#16a34a' }} />, label: 'Hỗ trợ 24/7' },
  { icon: <VerifiedIcon sx={{ fontSize: 20, color: '#16a34a' }} />, label: 'Người bán xác minh' },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#0f172a',
        color: 'white',
        mt: 'auto',
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="xl">
        {/* Trust badges */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, md: 6 },
            mb: 5,
            flexWrap: 'wrap',
          }}
        >
          {trustBadges.map((badge, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 1.2,
                borderRadius: 2,
                bgcolor: alpha('#16a34a', 0.1),
                border: '1px solid',
                borderColor: alpha('#16a34a', 0.2),
              }}
            >
              {badge.icon}
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.8rem' }}>
                {badge.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Grid container spacing={4}>
          {/* Brand */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StorefrontIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                <Box component="span" sx={{ color: '#22c55e' }}>MARKET</Box>MMO
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.8, mb: 2, fontSize: '0.82rem' }}>
              Sàn giao dịch trung gian số 1 Việt Nam. Mua bán sản phẩm & dịch vụ số an toàn với cơ chế Escrow bảo vệ người mua.
            </Typography>
            {/* Social links */}
            <Stack direction="row" spacing={1}>
              {[
                { icon: <FacebookIcon fontSize="small" />, href: '#', color: '#1877f2' },
                { icon: <TelegramIcon fontSize="small" />, href: '#', color: '#26a5e4' },
                { icon: <YouTubeIcon fontSize="small" />, href: '#', color: '#ff0000' },
              ].map((social, i) => (
                <IconButton
                  key={i}
                  component="a"
                  href={social.href}
                  size="small"
                  sx={{
                    bgcolor: alpha(social.color, 0.1),
                    color: social.color,
                    border: `1px solid ${alpha(social.color, 0.2)}`,
                    '&:hover': { bgcolor: alpha(social.color, 0.2) },
                    width: 34,
                    height: 34,
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Links */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#e2e8f0' }}>
              Về chúng tôi
            </Typography>
            <Stack spacing={1}>
              {footerLinks.company.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.82rem',
                      '&:hover': { color: '#22c55e' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#e2e8f0' }}>
              Dành cho người mua
            </Typography>
            <Stack spacing={1}>
              {footerLinks.buyer.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.82rem',
                      '&:hover': { color: '#22c55e' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#e2e8f0' }}>
              Đăng ký bán hàng
            </Typography>
            <Stack spacing={1}>
              {footerLinks.seller.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.82rem',
                      '&:hover': { color: '#22c55e' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#1e293b' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            © 2026 MarketMMO. Tất cả quyền được bảo lưu.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Phiên bản 1.0.0 · Hỗ trợ:{' '}
            <Box component="span" sx={{ color: '#22c55e' }}>
              support@marketmmo.vn
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
