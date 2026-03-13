import React from 'react';
import { Box } from '@mui/material';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import MainNav from '@/components/layout/MainNav';
import Footer from '@/components/layout/Footer';

export default function SiteLayout({ children, hideFooter = false }: { children: React.ReactNode; hideFooter?: boolean }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: hideFooter ? '100vh' : 'auto',
      minHeight: '100vh',
      overflow: hideFooter ? 'hidden' : 'visible'
    }}>
      <AnnouncementBar />
      <Header />
      <MainNav />
      <Box component="main" sx={{ flex: 1, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </Box>
      {!hideFooter && <Footer />}
    </Box>
  );
}
