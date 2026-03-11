'use client';
import React, { useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Paper, Typography, Button, Chip, Alert,
  TextField, InputAdornment, IconButton, alpha, Grid, Divider, Select, MenuItem, FormControl,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const statusMap: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  HOLDING: { label: 'Tạm giữ', color: '#d97706', bg: '#fef3c7', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
  COMPLETED: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  DISPUTED: { label: 'Khiếu nại', color: '#dc2626', bg: '#fee2e2', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
  PENDING: { label: 'Đang xử lý', color: '#64748b', bg: '#f1f5f9', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
};

const mockOrders: object[] = []; // empty for new user

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  return (
    <SiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <ReceiptLongIcon sx={{ fontSize: 36, opacity: 0.9 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Đơn Hàng Đã Mua</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Quản lý và theo dõi lịch sử mua tài nguyên của bạn</Typography>
          </Box>
        </Box>

        {/* Escrow info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              icon: <AccessTimeIcon sx={{ fontSize: 20, color: '#d97706' }} />,
              title: 'Tạm giữ',
              desc: 'Tiền đang được MarketMMO giữ 3 ngày để bảo mật quyền lợi cho bạn.',
              bg: '#fefce8',
              border: '#fde68a',
            },
            {
              icon: <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#16a34a' }} />,
              title: 'Hoàn thành',
              desc: 'Sau 3 ngày tiền đã được chuyển cho người bán.',
              bg: '#f0fdf4',
              border: '#bbf7d0',
            },
            {
              icon: <WarningAmberIcon sx={{ fontSize: 20, color: '#dc2626' }} />,
              title: 'Khiếu nại',
              desc: 'Đơn hàng được treo tiền (mãi mãi) để chờ bạn và người bán giải quyết xong sự cố.',
              bg: '#fff1f2',
              border: '#fecdd3',
            },
            {
              icon: <InfoOutlinedIcon sx={{ fontSize: 20, color: '#0284c7' }} />,
              title: 'Lưu ý quan trọng',
              desc: 'Bên mình chỉ giữ tiền 3 ngày. Không có khiếu nại, tiền tự chuyển cho người bán.',
              bg: '#f0f9ff',
              border: '#bae6fd',
            },
          ].map((item, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: item.bg, border: '1px solid', borderColor: item.border, display: 'flex', gap: 1.5 }}>
                <Box sx={{ flexShrink: 0, mt: 0.2 }}>{item.icon}</Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>- {item.title}:</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '0.78rem' }}>{item.desc}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Alert
          severity="warning"
          variant="outlined"
          sx={{ mb: 3, borderRadius: 2, fontSize: '0.82rem' }}
        >
          Trong trường hợp chủ shop không giải quyết hoặc giải quyết không thỏa đáng, hãy bấm{' '}
          <strong>"Khiếu nại đơn hàng"</strong>, để bên mình có thể giữ tiền đơn hàng đó (lâu hơn 3 ngày) trong lúc bạn đợi phản hồi từ người bán. Bạn hoàn toàn có thể Hủy khiếu nại sau đó.
        </Alert>

        {/* Search & Filter */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Nhập mã đơn, tên SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <MenuItem value="all">Tất cả mục</MenuItem>
                <MenuItem value="digital">Sản phẩm số</MenuItem>
                <MenuItem value="service">Dịch vụ</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} sx={{ px: 2.5 }}>
              Tìm đơn
            </Button>
          </Box>
        </Paper>

        {/* Empty state */}
        {mockOrders.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              Bạn chưa có đơn hàng nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Khám phá hàng nghìn sản phẩm số và dịch vụ chất lượng trên MarketMMO
            </Typography>
            <Button
              variant="contained"
              href="/"
              size="large"
              sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
            >
              Mua sắm ngay
            </Button>
          </Paper>
        )}

        {/* Warning banner */}
        <Alert
          severity="error"
          variant="outlined"
          icon={<WarningAmberIcon />}
          sx={{ mt: 3, borderRadius: 2, fontSize: '0.8rem' }}
        >
          ⚠️ Cấm tuyệt đối dùng tài khoản mua từ web vào mục đích vi phạm pháp luật. Nếu vi phạm, bạn phải chịu trách nhiệm hoàn toàn, tài khoản sẽ bị khóa vĩnh viễn!
        </Alert>
      </Container>
    </SiteLayout>
  );
}
