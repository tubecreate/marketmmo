'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Grid, Paper, Typography, Button, Avatar, Chip,
  Divider, LinearProgress, Skeleton, alpha, IconButton, Tooltip,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import AddCardIcon from '@mui/icons-material/AddCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TelegramIcon from '@mui/icons-material/Telegram';
import KeyIcon from '@mui/icons-material/Key';
import ShieldIcon from '@mui/icons-material/Shield';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/context/AuthContext';

const levelConfig = [
  { level: 0, name: 'Người mới', color: '#64748b', min: 0, max: 500000, emoji: '🆕' },
  { level: 1, name: 'Thành viên', color: '#16a34a', min: 500000, max: 5000000, emoji: '💚' },
  { level: 2, name: 'Thành viên VIP', color: '#0284c7', min: 5000000, max: 20000000, emoji: '💎' },
  { level: 3, name: 'Đại lý', color: '#7c3aed', min: 20000000, max: 100000000, emoji: '👑' },
  { level: 4, name: 'Đại lý Cao cấp', color: '#b45309', min: 100000000, max: 500000000, emoji: '🔱' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const stored = localStorage.getItem('mmo_user');
      if (!stored) { router.push('/dang-nhap'); return; }
      await refreshUser();
      setLoading(false);
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => { logout(); router.push('/'); };

  if (loading || !user) {
    return (
      <SiteLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rounded" height={80} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}><Skeleton variant="rounded" height={300} /></Grid>
            <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="rounded" height={300} /></Grid>
          </Grid>
        </Container>
      </SiteLayout>
    );
  }

  const lvIndex = Math.min(user.level, levelConfig.length - 1);
  const currentLevel = levelConfig[lvIndex];
  const nextLevel = levelConfig[Math.min(lvIndex + 1, levelConfig.length - 1)];
  const totalSpent = (user as any).totalRevenue ?? 0;
  const progress = ((totalSpent - currentLevel.min) / (nextLevel.max - currentLevel.min)) * 100;
  const joinDate = new Date(user.createdAt).toLocaleDateString('vi-VN');

  return (
    <SiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page header */}
        <Box sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.5rem', border: '2px solid rgba(255,255,255,0.5)' }}>
            {user.username[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Trang Cá Nhân</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Xin chào, {user.fullName || user.username}!</Typography>
          </Box>
          <Button onClick={handleLogout} variant="outlined" size="small" startIcon={<LogoutIcon />}
            sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Đăng xuất
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Left: Profile info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#16a34a', fontSize: '2rem', mx: 'auto', mb: 1.5, border: '3px solid #22c55e', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                  {user.username[0].toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.username}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label="🟢 Đang hoạt động" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: '0.72rem' }} />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {[
                { label: 'Tài khoản', value: user.username },
                { label: 'Email', value: user.email },
                { label: 'Ngày tham gia', value: joinDate },
                {
                  label: 'Số dư tài khoản',
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.9rem' }}>
                        {user.balance.toLocaleString('vi-VN')} VNĐ
                      </Typography>
                      <Chip label="Biến động" size="small" variant="outlined"
                        icon={<TrendingUpIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{ height: 20, fontSize: '0.62rem', color: '#16a34a', borderColor: '#16a34a' }}
                      />
                    </Box>
                  ),
                },
                { label: 'Tổng đơn hàng', value: (user as any)._count?.buyerOrders ?? 0 },
                { label: 'Vai trò', value: <Chip label={user.role} size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontSize: '0.7rem' }} /> },
              ].map((row, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{row.label}:</Typography>
                  {typeof row.value === 'string' || typeof row.value === 'number' ? (
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.value}</Typography>
                  ) : row.value}
                </Box>
              ))}

              <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />}
                sx={{ mt: 2, borderRadius: 2, borderColor: '#16a34a', color: '#16a34a' }}
              >
                Chỉnh sửa hồ sơ
              </Button>
            </Paper>

            {/* Quick actions */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Thao tác nhanh</Typography>
              {[
                { icon: <AddCardIcon fontSize="small" />, label: 'Nạp tiền', href: '/tai-khoan/nap-tien', color: '#16a34a' },
                { icon: <HistoryIcon fontSize="small" />, label: 'Đơn hàng đã mua', href: '/tai-khoan/don-hang', color: '#0284c7' },
                { icon: <KeyIcon fontSize="small" />, label: 'Lấy mã 2FA', href: '/tai-khoan/lay-2fa', color: '#7c3aed' },
              ].map((action, i) => (
                <Button key={i} component={Link} href={action.href} fullWidth startIcon={action.icon}
                  sx={{ justifyContent: 'flex-start', color: action.color, bgcolor: alpha(action.color, 0.06), border: `1px solid ${alpha(action.color, 0.2)}`, borderRadius: 2, mb: 1, fontWeight: 600, fontSize: '0.82rem', '&:hover': { bgcolor: alpha(action.color, 0.1) } }}
                >
                  {action.label}
                </Button>
              ))}
            </Paper>
          </Grid>

          {/* Right: Level + Security */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Cấp độ thành viên</Typography>
              <Box sx={{ p: 2.5, borderRadius: 2, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip label={`${currentLevel.emoji} Level ${currentLevel.level}. ${currentLevel.name}`}
                    sx={{ bgcolor: currentLevel.color, color: 'white', fontWeight: 700, fontSize: '0.82rem' }} />
                  <Typography variant="caption" color="text.secondary">
                    Mục tiêu: {nextLevel.min.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, progress))}
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#bbf7d0', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 4 }, mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Tổng giao dịch: {totalSpent.toLocaleString('vi-VN')}đ &nbsp;·&nbsp;
                  Cần thêm <strong>{Math.max(0, nextLevel.min - totalSpent).toLocaleString('vi-VN')}đ</strong> để lên {nextLevel.emoji} {nextLevel.name}
                </Typography>
              </Box>

              <Grid container spacing={1}>
                {levelConfig.map((lv) => (
                  <Grid key={lv.level} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: user.level === lv.level ? lv.color : 'divider', bgcolor: user.level === lv.level ? alpha(lv.color, 0.06) : 'transparent', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>{lv.emoji}</Typography>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: lv.color, display: 'block' }}>Level {lv.level}. {lv.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>≥ {lv.min.toLocaleString('vi-VN')}đ giao dịch</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <ShieldIcon sx={{ color: '#16a34a', fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Bảo mật tài khoản</Typography>
              </Box>
              {[
                { icon: <VerifiedUserIcon sx={{ color: user.twoFactorEnabled ? '#16a34a' : '#94a3b8' }} />, title: 'Xác thực hai lớp (2FA)', desc: 'Bảo vệ tài khoản bằng mã OTP khi đăng nhập', status: user.twoFactorEnabled },
                { icon: <TelegramIcon sx={{ color: user.telegramId ? '#26a5e4' : '#94a3b8' }} />, title: 'Liên kết Telegram', desc: 'Nhận thông báo đơn hàng và biến động số dư', status: !!user.telegramId },
                { icon: <SecurityIcon sx={{ color: '#94a3b8' }} />, title: 'Nhật ký hoạt động', desc: 'Xem lịch sử đăng nhập và thiết bị truy cập', status: null },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 1.5, '&:last-child': { mb: 0 }, '&:hover': { borderColor: '#16a34a', bgcolor: alpha('#16a34a', 0.02) }, transition: 'all 0.2s' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{item.desc}</Typography>
                    </Box>
                  </Box>
                  {item.status !== null ? (
                    <Chip label={item.status ? 'Đã bật' : 'Chưa bật'} size="small"
                      sx={{ bgcolor: item.status ? '#dcfce7' : '#fee2e2', color: item.status ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                    />
                  ) : (
                    <Button size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Xem nhật ký</Button>
                  )}
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </SiteLayout>
  );
}
