'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box, Container, Button, Menu, MenuItem, alpha,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const productCategories = [
  { label: 'Tất cả sản phẩm', href: '/san-pham' },
  { label: 'Tài khoản', href: '/san-pham/tai-khoan' },
  { label: 'Key phần mềm', href: '/san-pham/key-phan-mem' },
  { label: 'File & Tool', href: '/san-pham/file-tool' },
  { label: 'Email accounts', href: '/san-pham/email' },
];

const serviceCategories = [
  { label: 'Tất cả dịch vụ', href: '/dich-vu' },
  { label: 'Thiết kế', href: '/dich-vu/thiet-ke' },
  { label: 'Lập trình', href: '/dich-vu/lap-trinh' },
  { label: 'Marketing', href: '/dich-vu/marketing' },
  { label: 'Tăng tương tác', href: '/dich-vu/tang-tuong-tac' },
];

const depositItems = [
  { label: 'Nạp qua SePay (QR)', href: '/tai-khoan/nap-tien' },
  { label: 'Lịch sử nạp tiền', href: '/tai-khoan/nap-tien/lich-su' },
];

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', children: productCategories },
  { label: 'Dịch vụ', children: serviceCategories },
  { label: 'Nạp tiền', children: depositItems },
  { label: 'Đơn Hàng', href: '/tai-khoan/don-hang' },
  { label: 'Lấy 2FA', href: '/tai-khoan/lay-2fa' },
  { label: 'Kiếm tiền', href: '/tai-khoan/kiem-tien' },
  { label: 'Diễn đàn', href: '/dien-dan' },
  { label: 'Đăng Ký Bán Hàng', href: '/dang-ky-ban-hang', highlight: true },
];

function DropdownNavItem({ item }: { item: NavItem }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const isActive = item.children?.some((c) => pathname.startsWith(c.href));

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16, ml: -0.5 }} />}
        sx={{
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          fontSize: '0.83rem',
          fontWeight: isActive ? 700 : 500,
          color: isActive ? '#16a34a' : '#334155',
          bgcolor: isActive ? alpha('#16a34a', 0.08) : 'transparent',
          whiteSpace: 'nowrap',
          minWidth: 'auto',
          '&:hover': { bgcolor: alpha('#16a34a', 0.08), color: '#16a34a' },
          '& .MuiButton-endIcon': { ml: 0.25 },
        }}
      >
        {item.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ onMouseLeave: () => setAnchorEl(null) }}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 0.5,
            minWidth: 200,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            py: 0.5,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
              px: 2,
              borderRadius: 1,
              mx: 0.5,
              '&:hover': { color: '#16a34a', bgcolor: alpha('#16a34a', 0.06) },
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {item.children?.map((child) => (
          <MenuItem key={child.href} component={Link} href={child.href} onClick={() => setAnchorEl(null)}>
            {child.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default function MainNav() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 118,
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
                href={item.href || '/'}
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
                {item.label}
              </Button>
            ) : (
              <Button
                key={item.label}
                component={Link}
                href={item.href || '/'}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  fontSize: '0.83rem',
                  fontWeight: pathname === item.href ? 700 : 500,
                  color: pathname === item.href ? '#16a34a' : '#334155',
                  bgcolor: pathname === item.href ? alpha('#16a34a', 0.08) : 'transparent',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  '&:hover': { bgcolor: alpha('#16a34a', 0.08), color: '#16a34a' },
                }}
              >
                {item.label}
              </Button>
            )
          )}
        </Box>
      </Container>
    </Box>
  );
}
