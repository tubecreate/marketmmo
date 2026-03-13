'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  AppBar, Toolbar, Box, Typography, InputBase,
  Avatar, Button, Menu, MenuItem, Divider,
  alpha, Container, Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import KeyIcon from '@mui/icons-material/Key';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ForumIcon from '@mui/icons-material/Forum';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddCardIcon from '@mui/icons-material/AddCard';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, logout, unreadCount } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'white',
        color: 'text.primary',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 1100,
      }}
    >
      {/* Top Utility Bar */}
      <Box sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: { xs: 'none', md: 'block' } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: '#4cc752' } }}>Tiếng Việt · VNĐ</Typography>
            </Box>
            <Box>
              <Link href="/dang-ky-ban-hang" style={{ textDecoration: 'none' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: '#4cc752' } }}>Bắt đầu bán hàng</Typography>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            gap: { xs: 1, md: 3 },
            minHeight: { xs: 64, sm: 80 },
            py: 1,
            mx: 'auto',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: { xs: 32, md: 40 },
                  height: { xs: 32, md: 40 },
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4cc752 0%, #22c55e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(76,199,82,0.35)',
                  flexShrink: 0,
                }}
              >
                <StorefrontIcon sx={{ color: 'white', fontSize: { xs: 18, md: 22 } }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                }}
              >
                <Box component="span" sx={{ color: '#4cc752' }}>GG</Box>
                <Box component="span" sx={{ color: '#0f172a' }}>SEL</Box>
              </Typography>
            </Box>
          </Link>

          {/* Catalog Button */}
          <Button
            variant="contained"
            disableElevation
            startIcon={<MenuIcon />}
            sx={{
              display: { xs: 'none', md: 'flex' },
              bgcolor: '#eff1f3',
              color: '#0f172a',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              height: 48,
              '&:hover': { bgcolor: '#e5e7eb' },
            }}
          >
            Danh mục
          </Button>

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/tim-kiem?q=${encodeURIComponent(searchQuery)}`;
              }
            }}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#eff1f3',
              borderRadius: '12px',
              px: 2,
              height: { xs: 40, md: 48 },
              transition: 'all 0.2s ease',
              '&:focus-within': {
                bgcolor: 'white',
                boxShadow: `0 0 0 2px ${alpha('#4cc752', 0.2)}`,
                border: '1px solid #4cc752',
              },
            }}
          >
            <SearchIcon sx={{ color: '#94a3b8', fontSize: 20, mr: 1, flexShrink: 0 }} />
            <InputBase
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.875rem', color: 'text.primary' }}
            />
          </Box>

          {/* Right side - User Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 2.5 }, flexShrink: 0 }}>
            {user ? (
              <>
                <Box
                  component={Link}
                  href="/tai-khoan/don-hang"
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#475569', textDecoration: 'none', transition: 'color 0.2s', '&:hover': { color: '#0f172a' } }}
                >
                  <LocalMallIcon sx={{ fontSize: 24 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', mt: 0.3 }}>Đơn hàng</Typography>
                </Box>

                <Box
                  component={Link}
                  href="/user_chat"
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#475569', textDecoration: 'none', transition: 'color 0.2s', '&:hover': { color: '#0f172a' } }}
                >
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                  >
                    <ForumIcon sx={{ fontSize: 24 }} />
                  </Badge>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', mt: 0.3 }}>Tin nhắn</Typography>
                </Box>

                <Box
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    cursor: 'pointer', 
                    p: 0.5,
                    pr: { xs: 0.5, md: 1.5 },
                    borderRadius: 2,
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      bgcolor: '#f8fafc',
                      borderColor: '#e2e8f0'
                    }
                  }}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: '#4cc752',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: 1.5,
                    }}
                  >
                    {user.username[0].toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#0f172a' }}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                      {user.balance.toLocaleString('vi-VN')}đ
                    </Typography>
                  </Box>
                </Box>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{
                    elevation: 4,
                    sx: {
                      mt: 1.5,
                      minWidth: 220,
                      borderRadius: 2.5,
                      border: '1px solid #e2e8f0',
                      py: 0.5,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2.5, py: 1.5, display: { md: 'none' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    <Box sx={{ mt: 0.75, px: 1.5, py: 0.5, bgcolor: '#f0fdf4', borderRadius: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, color: '#16a34a', fontSize: '0.9rem' }}>{user.balance.toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ display: { md: 'none' } }} />
                  {[
                    { icon: <PersonOutlineIcon fontSize="small" />, label: 'Cài đặt tài khoản', href: '/tai-khoan' },
                    { icon: <AddCardIcon fontSize="small" />, label: 'Nạp tiền', href: '/tai-khoan/nap-tien' },
                    { icon: <KeyIcon fontSize="small" />, label: 'Lấy 2FA', href: '/tai-khoan/lay-2fa' },
                    { icon: <MonetizationOnOutlinedIcon fontSize="small" />, label: 'Kiếm tiền', href: '/tai-khoan/kiem-tien' },
                  ].concat(
                    (user.role === 'SELLER' || user.role === 'ADMIN')
                      ? [{ icon: <StorefrontIcon fontSize="small" />, label: 'Quản lý gian hàng', href: '/ban-hang' }]
                      : []
                  ).map((item) => (
                    <MenuItem
                      key={item.href}
                      component={Link}
                      href={item.href}
                      onClick={() => setAnchorEl(null)}
                      sx={{ gap: 1.5, py: 1, fontSize: '0.875rem', '&:hover': { color: '#16a34a', bgcolor: '#f0fdf4' } }}
                    >
                      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{item.icon}</Box>
                      {item.label}
                    </MenuItem>
                  ))}
                  {user.role === 'BUYER' && (!user.sellerRequest || user.sellerRequest.status === 'REJECTED') && (
                    <>
                      <Divider />
                      <MenuItem
                        component={Link}
                        href="/dang-ky-ban-hang"
                        onClick={() => setAnchorEl(null)}
                        sx={{ gap: 1.5, py: 1, color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        <StorefrontIcon fontSize="small" /> Đăng ký bán hàng
                      </MenuItem>
                    </>
                  )}
                  {user.role === 'ADMIN' && (
                    <>
                      <Divider />
                      <MenuItem
                        component={Link}
                        href="/admin/settings"
                        onClick={() => setAnchorEl(null)}
                        sx={{ gap: 1.5, py: 1, color: '#0f172a', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        <AdminPanelSettingsIcon fontSize="small" sx={{ color: '#475569' }} /> Admin Panel
                      </MenuItem>
                    </>
                  )}
                  <Divider />
                  <MenuItem
                    onClick={() => { setAnchorEl(null); logout(); }}
                    sx={{ gap: 1.5, py: 1, color: '#dc2626', fontSize: '0.875rem' }}
                  >
                    <LogoutIcon fontSize="small" /> Đăng xuất
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box component={Link} href="/dang-nhap" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: '#475569', textDecoration: 'none', '&:hover': { color: '#0f172a' } }}>
                <PersonOutlineIcon sx={{ fontSize: 24 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Login</Typography>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
