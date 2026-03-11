import React from 'react';
import { Box } from '@mui/material';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import MainNav from '@/components/layout/MainNav';
import Footer from '@/components/layout/Footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AnnouncementBar />
      <Header />
      <MainNav />
      <Box component="main" sx={{ flex: 1, bgcolor: '#f8fafc' }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
