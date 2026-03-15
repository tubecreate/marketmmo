'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Box, Container, Button, Menu, MenuItem, alpha
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HandymanIcon from '@mui/icons-material/Handyman';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ForumIcon from '@mui/icons-material/Forum';

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
  highlight?: boolean;
  icon?: React.ReactNode;
}

function DropdownNavItem({ item }: { item: NavItem }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const isActive = item.children?.some((c) => pathname === c.href);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box onMouseLeave={handleClose}>
      <Button
        onMouseEnter={handleOpen}
        onClick={handleOpen}
        endIcon={<KeyboardArrowDownIcon sx={{ 
          fontSize: 16, 
          transition: 'transform 0.2s',
          transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'none'
        }} />}
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 2,
          fontSize: '0.875rem',
          fontWeight: isActive ? 700 : 600,
          color: isActive ? '#16a34a' : '#475569',
          bgcolor: isActive ? alpha('#16a34a', 0.08) : 'transparent',
          whiteSpace: 'nowrap',
          minWidth: 'auto',
          flexDirection: 'column',
          gap: 0.5,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: alpha('#16a34a', 0.08), color: '#16a34a' },
          '& .MuiButton-endIcon': { m: 0, position: 'absolute', right: 4, top: '50%', mt: -1 },
        }}
      >
        {item.icon}
        {item.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        disableRestoreFocus
        sx={{ pointerEvents: 'none', mt: 0.5 }}
        PaperProps={{
          onMouseEnter: () => setAnchorEl(anchorEl),
          onMouseLeave: handleClose,
          elevation: 12,
          sx: {
            pointerEvents: 'auto',
            minWidth: 220,
            borderRadius: 3,
            border: '1px solid #f1f5f9',
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              fontWeight: 600,
              py: 1.25,
              px: 2,
              borderRadius: 2,
              mb: 0.5,
              transition: 'all 0.2s',
              color: '#475569',
              '&:last-child': { mb: 0 },
              '&:hover': { color: '#16a34a', bgcolor: alpha('#16a34a', 0.06), transform: 'translateX(4px)' },
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {item.children?.map((child) => (
          <MenuItem 
            key={child.href} 
            component={Link} 
            href={child.href} 
            onClick={handleClose}
          >
            {child.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
  parentId?: string | null;
}

export default function MainNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        // Handle both direct array and { categories: [] } formats
        const cats = Array.isArray(data) ? data : (data.categories || []);
        setCategories(cats);
      })
      .catch(err => console.error('Error fetching nav categories:', err));
  }, []);

  // Digital categories are those under 'email', 'khac', or 'tai-khoan'
  const productCats = categories
    .filter(c => {
      const parent = categories.find(p => p.id === c.parentId);
      return parent && ['email', 'khac', 'tai-khoan'].includes(parent.slug);
    })
    .map(c => ({ label: c.name, href: `/danh-muc/${c.slug}` }));

  // Service categories are those under 'dich-vu' (if exists, or fallback)
  const dichVuRoot = categories.find(c => c.slug === 'dich-vu');
  const serviceCats = categories
    .filter(c => dichVuRoot && c.parentId === dichVuRoot.id)
    .map(c => ({ label: c.name, href: `/danh-muc/${c.slug}` }));

  const navItems: NavItem[] = [
    { label: 'Trang chủ', href: '/', icon: <HomeIcon sx={{ fontSize: 20 }} /> },
    { 
      label: 'Loại sản phẩm', 
      icon: <ShoppingBagIcon sx={{ fontSize: 20 }} />,
      children: productCats.length > 0 ? productCats : undefined
    },
    { 
      label: 'Loại dịch vụ', 
      icon: <HandymanIcon sx={{ fontSize: 20 }} />,
      children: serviceCats.length > 0 ? serviceCats : undefined
    },
    { label: 'Gian hàng', href: '/ban-hang', icon: <StorefrontIcon sx={{ fontSize: 20 }} /> },
    { label: 'Diễn đàn', href: '/dien-dan', icon: <ForumIcon sx={{ fontSize: 20 }} /> },
  ];

  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';

  return (
    <Box
      sx={{
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 1050,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 0, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 0.5,
            mx: 'auto',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {navItems.map((item) =>
            item.children ? (
              <DropdownNavItem key={item.label} item={item} />
            ) : item.highlight ? (
              <Button
                key={item.label}
                component={Link}
                href={item.highlight && isSeller ? '/ban-hang/dashboard' : (item.href || '/')}
                disableElevation
                sx={{
                  px: 2,
                  py: 0.75,
                  ml: 0.5,
                  borderRadius: 1.5,
                  fontSize: '0.83rem',
                  fontWeight: 700,
                  color: 'white',
                  bgcolor: '#16a34a',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                {item.highlight && isSeller ? 'Quản Lý Gian Hàng' : item.label}
              </Button>
            ) : (
              <Button
                key={item.label}
                component={Link}
                href={item.href || '/'}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: pathname === item.href ? 700 : 600,
                  color: pathname === item.href ? '#16a34a' : '#475569',
                  bgcolor: pathname === item.href ? alpha('#16a34a', 0.08) : 'transparent',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  flexDirection: 'column',
                  gap: 0.5,
                  '&:hover': { bgcolor: alpha('#16a34a', 0.08), color: '#16a34a' },
                }}
              >
                {item.icon}
                {item.label}
              </Button>
            )
          )}
        </Box>
      </Container>
    </Box>
  );
}

