'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  AppBar, Toolbar, Box, Typography, InputBase, IconButton,
  Badge, Avatar, Button, Menu, MenuItem, Divider, Tooltip,
  alpha, Container,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddCardIcon from '@mui/icons-material/AddCard';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import KeyIcon from '@mui/icons-material/Key';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'white',
        color: 'text.primary',
        borderBottom: '2px solid',
        borderColor: '#16a34a',
        zIndex: 1100,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            gap: 3,
            minHeight: { xs: 70, sm: 80 },
            py: 1,
            mx: 'auto',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                  flexShrink: 0,
                }}
              >
                <StorefrontIcon sx={{ color: 'white', fontSize: 22 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontSize: '1.25rem',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                <Box component="span" sx={{ color: '#16a34a' }}>MARKET</Box>
                <Box component="span" sx={{ color: '#0f172a' }}>MMO</Box>
              </Typography>
            </Box>
          </Link>

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
              maxWidth: 600,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8fafc',
              border: '1.5px solid',
              borderColor: '#e2e8f0',
              borderRadius: '10px',
              px: 1.5,
              height: 44,
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: '#16a34a',
                bgcolor: 'white',
                boxShadow: `0 0 0 3px ${alpha('#16a34a', 0.12)}`,
              },
            }}
          >
            <SearchIcon sx={{ color: '#94a3b8', fontSize: 20, mr: 1, flexShrink: 0 }} />
            <InputBase
              placeholder="Tìm gian hàng hoặc người bán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.875rem', color: 'text.primary' }}
            />
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{
                minWidth: 72,
                height: 32,
                borderRadius: '7px',
                fontSize: '0.82rem',
                fontWeight: 700,
                ml: 1,
                flexShrink: 0,
                px: 2,
              }}
            >
              Tìm
            </Button>
          </Box>

          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 'auto' }}>
            {user ? (
              <>
                <Tooltip title="Chat">
                  <Link href="/user_chat" style={{ color: 'inherit' }}>
                    <IconButton size="medium" sx={{ color: '#475569' }}>
                      <Badge color="primary" variant="dot">
                        <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
                      </Badge>
                    </IconButton>
                  </Link>
                </Tooltip>

                <Tooltip title="Giỏ hàng">
                  <IconButton size="medium" sx={{ color: '#475569' }}>
                    <Badge badgeContent={3} color="primary">
                      <ShoppingCartOutlinedIcon sx={{ fontSize: 22 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Yêu thích">
                  <IconButton size="medium" sx={{ color: '#475569' }}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Tooltip>

                {/* Balance pill */}
                <Box
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 0.75,
                    bgcolor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 3,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#dcfce7' },
                  }}
                >
                  <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                  <Typography sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>
                    {user.balance.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>

                {/* Avatar */}
                <Box
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', ml: 0.5 }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: '#16a34a',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      border: '2px solid #22c55e',
                    }}
                  >
                    {user.username[0].toUpperCase()}
                  </Avatar>
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
                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    <Box sx={{ mt: 0.75, px: 1.5, py: 0.5, bgcolor: '#f0fdf4', borderRadius: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, color: '#16a34a', fontSize: '0.9rem' }}>{user.balance.toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                  </Box>
                  <Divider />
                  {[
                    { icon: <PersonOutlineIcon fontSize="small" />, label: 'Tài khoản', href: '/tai-khoan' },
                    { icon: <HistoryIcon fontSize="small" />, label: 'Đơn hàng đã mua', href: '/tai-khoan/don-hang' },
                    { icon: <AddCardIcon fontSize="small" />, label: 'Nạp tiền', href: '/tai-khoan/nap-tien' },
                    { icon: <KeyIcon fontSize="small" />, label: 'Lấy 2FA', href: '/tai-khoan/lay-2fa' },
                    { icon: <MonetizationOnOutlinedIcon fontSize="small" />, label: 'Kiếm tiền', href: '/tai-khoan/kiem-tien' },
                    { icon: <StorefrontIcon fontSize="small" />, label: 'Quản lý gian hàng', href: '/ban-hang' },
                  ].map((item) => (
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
                  <Divider />
                  <MenuItem
                    component={Link}
                    href="/dang-ky-ban-hang"
                    onClick={() => setAnchorEl(null)}
                    sx={{ gap: 1.5, py: 1, color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    <StorefrontIcon fontSize="small" /> Đăng ký bán hàng
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => { setAnchorEl(null); logout(); }}
                    sx={{ gap: 1.5, py: 1, color: '#dc2626', fontSize: '0.875rem' }}
                  >
                    <LogoutIcon fontSize="small" /> Đăng xuất
                  </MenuItem>
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
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  component={Link}
                  href="/dang-nhap"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: '#16a34a',
                    color: '#16a34a',
                    px: 2.5,
                    py: 0.75,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                  }}
                >
                  Đăng nhập
                </Button>
                <Button
                  component={Link}
                  href="/dang-ky"
                  variant="contained"
                  disableElevation
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.75,
                    fontWeight: 600,
                  }}
                >
                  Đăng ký
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
