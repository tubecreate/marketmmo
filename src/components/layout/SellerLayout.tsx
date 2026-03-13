'use client';
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import SiteLayout from './SiteLayout';
import SellerSidebar from '../seller/SellerSidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  // Check role: only SELLER or ADMIN can access
  if (!user || (user.role !== 'SELLER' && user.role !== 'ADMIN')) {
    return (
      <SiteLayout>
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          minHeight: '60vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Typography color="error" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Truy cập bị từ chối</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Bạn cần được duyệt làm <strong>Người bán</strong> để truy cập khu vực này.
          </Typography>
          <Button 
            variant="contained" 
            color="success" 
            component={Link} 
            href="/dang-ky-ban-hang"
            sx={{ px: 4, py: 1, borderRadius: 2, fontWeight: 700 }}
          >
            Đăng ký bán hàng ngay
          </Button>
          <Button sx={{ mt: 2 }} variant="text" component={Link} href="/">
            Trở về trang chủ
          </Button>
        </Box>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Box sx={{ bgcolor: '#f1f5f9', minHeight: 'calc(100vh - 120px)' }}>
        <Container maxWidth="xl" sx={{ display: 'flex', px: { xs: 0, md: 1.5 }, py: 3, gap: 2 }}>
          <SellerSidebar />
          <Box component="main" sx={{ flex: 1, p: 0, overflowX: 'hidden' }}>
            {children}
          </Box>
        </Container>
      </Box>
    </SiteLayout>
  );
}
