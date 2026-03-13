'use client';
import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, AppBar, Toolbar, IconButton, useMediaQuery, useTheme,
  Avatar, Divider, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import GavelIcon from '@mui/icons-material/Gavel';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/admin' },
  { text: 'Cài đặt hệ thống', icon: <SettingsIcon />, href: '/admin/settings' },
  { text: 'Ngoại lệ thành viên', icon: <PeopleIcon />, href: '/admin/overrides' },
  { text: 'Quản lý tranh chấp', icon: <GavelIcon />, href: '/admin/disputes' },
  { text: 'Duyệt gian hàng', icon: <StorefrontIcon />, href: '/admin/products' },
  { text: 'Duyệt người bán', icon: <GroupAddIcon />, href: '/admin/seller-requests' },
  { text: 'Cấu hình Chatbot', icon: <SmartToyIcon />, href: '/admin/chatbot' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isReady, setIsReady] = useState(false);

  React.useEffect(() => { setIsReady(true); }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  if (!isReady) return null;

  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">Bạn không có quyền truy cập trang này.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" component={Link} href="/">Trở về trang chủ</Button>
      </Box>
    );
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', color: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <StorefrontIcon sx={{ color: '#10b981', fontSize: 32 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
          Admin Panel
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: isActive ? '#10b981' : '#cbd5e1',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#10b981' : 'white',
                },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500 }} 
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          startIcon={<ExitToAppIcon />}
          onClick={async () => {
            await logout();
            router.push('/auth/login');
          }}
          sx={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.2)', '&:hover': { color: 'white', borderColor: 'white' } }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{user?.username}</Typography>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>Quản trị viên</Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#10b981', width: 36, height: 36, fontWeight: 700 }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px', // Height of Toolbar
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
