'use client';
import React from 'react';
import { Box, Container } from '@mui/material';
import SiteLayout from './SiteLayout';
import SellerSidebar from '../seller/SellerSidebar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
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
