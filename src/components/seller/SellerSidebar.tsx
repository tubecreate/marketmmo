'use client';
import React from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, alpha,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HandymanIcon from '@mui/icons-material/Handyman';
import HistoryIcon from '@mui/icons-material/History';
import PaymentsIcon from '@mui/icons-material/Payments';
import GppGoodIcon from '@mui/icons-material/GppGood';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import GavelIcon from '@mui/icons-material/Gavel';
import StarIcon from '@mui/icons-material/Star';
import TelegramIcon from '@mui/icons-material/Telegram';
import CampaignIcon from '@mui/icons-material/Campaign';

const MENU_ITEMS = [
  { label: 'Tổng quan', icon: DashboardIcon, path: '/ban-hang/dashboard' },
  { label: 'Sản phẩm', icon: InventoryIcon, path: '/ban-hang' },
  { label: 'Đơn sản phẩm', icon: ReceiptLongIcon, path: '/ban-hang/don-hang' },
  { label: 'Đơn dịch vụ', icon: HandymanIcon, path: '/ban-hang/dich-vu' },
  { label: 'Đặt trước', icon: HistoryIcon, path: '/ban-hang/dat-truoc' },
  { label: 'Rút tiền', icon: PaymentsIcon, path: '/ban-hang/rut-tien' },
  { label: 'Quỹ Bảo Hiểm', icon: GppGoodIcon, path: '/ban-hang/bao-hiem' },
  { label: 'Mã giảm giá', icon: LocalActivityIcon, path: '/ban-hang/ma-giam-gia' },
  { label: 'Khiếu nại', icon: GavelIcon, path: '/ban-hang/khieu-nai' },
  { label: 'Đánh giá', icon: StarIcon, path: '/ban-hang/danh-gia' },
  { label: 'Telegram Bot', icon: TelegramIcon, path: '/ban-hang/telegram-bot' },
  { label: 'Quảng bá (Đấu giá)', icon: CampaignIcon, path: '/ban-hang/quang-ba' },
];

export default function SellerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box sx={{ 
      width: 210, 
      bgcolor: 'white', 
      height: 'fit-content', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      mt: 0,
      overflow: 'hidden',
      flexShrink: 0
    }}>
      <Box sx={{ p: 1.5, pt: 2, borderBottom: '1px solid #f1f5f9' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
          Menu Người Bán
        </Typography>
      </Box>
      <List sx={{ px: 1, py: 2 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path === '/ban-hang' && pathname === '/ban-hang');
          const Icon = item.icon;
          
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: '12px',
                  bgcolor: isActive ? '#16a34a' : 'transparent',
                  color: isActive ? '#fff' : '#475569',
                  '&:hover': {
                    bgcolor: isActive ? '#16a34a' : alpha('#16a34a', 0.1),
                  },
                  py: 1.2
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                  <Icon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem', 
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
