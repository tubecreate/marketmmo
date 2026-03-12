'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, Chip,
  Skeleton, alpha, Button, Divider
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

interface Stats {
  revenue: number;
  totalOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
  openDisputes: number;
  growthChart: { date: string, revenue: number, orders: number }[];
  recentProducts: {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail: string | null;
    status: string;
    createdAt: string;
    _count: { items: number };
  }[];
  recentOrders: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    product: { title: string, thumbnail: string | null };
    buyer: { username: string };
  }[];
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mmo_user');
      const localUser = stored ? JSON.parse(stored) : null;
      const uid = user?.id || localUser?.id;
      if (!uid) return;

      const res = await fetch(`/api/me/seller-stats?userId=${uid}`);
      const data: Stats = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Fetch seller stats error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const StatCard = ({ title, value, icon, color, subValue }: { title: string, value: string | number, icon: React.ReactElement, color: string, subValue?: string }) => (
    <Paper elevation={0} sx={{ 
      p: 2, borderRadius: 3, border: '1px solid #e2e8f0', 
      display: 'flex', alignItems: 'center', gap: 1.5,
      bgcolor: 'white', position: 'relative', overflow: 'hidden',
      height: '100%', minHeight: 90
    }}>
      <Box sx={{ 
        width: 44, height: 44, borderRadius: 2.5, 
        bgcolor: alpha(color, 0.1), color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {React.cloneElement(icon, { sx: { fontSize: 24 } })}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>{title}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{value}</Typography>
        {subValue && (
          <Typography variant="caption" sx={{ color: color, fontWeight: 700, fontSize: '0.65rem' }}>{subValue}</Typography>
        )}
      </Box>
      <Box sx={{ 
        position: 'absolute', right: -20, bottom: -20, 
        opacity: 0.05, transform: 'rotate(-15deg)',
        pointerEvents: 'none'
      }}>
        {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 80 } })}
      </Box>
    </Paper>
  );

  const getOrderStatusStyles = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { label: 'HOÀN THÀNH', bg: '#dcfce7', color: '#166534' };
      case 'HOLDING': return { label: 'TẠM GIỮ', bg: '#fffbeb', color: '#854d0e' };
      case 'DISPUTED': return { label: 'KHIẾU NẠI', bg: '#fef2f2', color: '#991b1b' };
      case 'REFUNDED': return { label: 'HOÀN TIỀN', bg: '#f1f5f9', color: '#475569' };
      default: return { label: status, bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 0 }}>Tổng quan gian hàng</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Chào mừng bạn quay trở lại!</Typography>
          </Box>
          <Button 
            variant="contained" disableElevation
            startIcon={<RefreshIcon />}
            onClick={fetchStats}
            sx={{ borderRadius: 2, fontWeight: 800, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            LÀM MỚI
          </Button>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {loading ? <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 3 }} /> : (
              <StatCard 
                title="Tổng doanh thu" 
                value={`${(stats?.revenue || 0).toLocaleString()}đ`}
                icon={<TrendingUpIcon />} 
                color="#16a34a"
                subValue="Thanh toán ổn định"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {loading ? <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 3 }} /> : (
              <StatCard 
                title="Tổng đơn hàng" 
                value={stats?.totalOrders || 0}
                icon={<ShoppingBagIcon />} 
                color="#0ea5e9"
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {loading ? <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 3 }} /> : (
              <StatCard 
                title="Hàng tồn kho" 
                value={stats?.totalStock || 0}
                icon={<Inventory2Icon />} 
                color="#f59e0b"
                subValue={`Từ ${stats?.totalProducts} sản phẩm`}
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            {loading ? <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} /> : (
              <StatCard 
                title="Khiếu nại" 
                value={stats?.openDisputes || 0}
                icon={<ReportProblemIcon />} 
                color="#ef4444"
                subValue={stats?.openDisputes === 0 ? "Tuyệt vời!" : "Cần xử lý"}
              />
            )}
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'stretch' }}>
          {/* Revenue Chart */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', minHeight: 320 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>Doanh thu 30 ngày qua</Typography>
                <Box sx={{ px: 1, py: 0.25, bgcolor: '#f0fdf4', borderRadius: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }}>TĂNG TRƯỞNG</Typography>
                </Box>
              </Box>
              <Box sx={{ height: 240, width: '100%' }}>
                {loading ? <Skeleton height="100%" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.growthChart || []}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(val) => `${val / 1000}k`}
                      />
                      <ChartTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(val: any) => [`${(Number(val) || 0).toLocaleString()}đ`, 'Doanh thu'] as [string, string]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#16a34a" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Inventory Chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', minHeight: 320 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 2 }}>Trạng thái kho hàng</Typography>
              
              <Box sx={{ height: 180, width: '100%', mt: 0 }}>
                {loading ? <Skeleton height="100%" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Đang bán', value: stats?.activeProducts || 0 },
                      { name: 'Tạm ẩn', value: (stats?.totalProducts || 0) - (stats?.activeProducts || 0) }
                    ]}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#16a34a" />
                        <Cell fill="#f1f5f9" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Tiền hàng (Tồn)</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>{(stats?.totalStock || 0).toLocaleString()} sản phẩm</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Tỷ lệ đơn hàng</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a' }}>+12% tuần này</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Lists Side-by-Side Section */}
        <Grid container spacing={2} sx={{ pb: 6 }}>
          {/* Product Overview Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>Sản phẩm mới</Typography>
                <Button 
                  size="small"
                  onClick={() => router.push('/ban-hang')}
                  sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  TẤT CẢ
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {loading ? [1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ borderRadius: 2 }} />) : 
                 stats?.recentProducts?.length === 0 ? (
                   <Typography variant="caption" sx={{ color: '#94a3b8', py: 2, display: 'block', textAlign: 'center' }}>Chưa có sản phẩm.</Typography>
                 ) : (
                  stats?.recentProducts.slice(0, 4).map((p) => (
                    <Box key={p.id} sx={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      p: 1.2, borderRadius: 2, border: '1px solid #f1f5f9',
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {p.thumbnail ? (
                          <Box component="img" src={p.thumbnail} sx={{ width: 32, height: 32, borderRadius: 1.5, objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>📦</Box>
                        )}
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>{p.price.toLocaleString()}đ</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a', fontSize: '0.7rem' }}>{p._count.items}</Typography>
                        </Box>
                        <Chip 
                          label={p.status === 'ACTIVE' ? 'HIỆN' : 'ẨN'} 
                          size="small"
                          sx={{ 
                            height: 18, fontSize: '0.6rem', fontWeight: 800,
                            bgcolor: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                            color: p.status === 'ACTIVE' ? '#166534' : '#64748b'
                          }} 
                        />
                      </Box>
                    </Box>
                  ))
                 )}
              </Box>
            </Paper>
          </Grid>

          {/* Recent Orders Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>Đơn hàng mới</Typography>
                <Button 
                  size="small"
                  onClick={() => router.push('/ban-hang/don-hang')}
                  sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  TẤT CẢ
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {loading ? [1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ borderRadius: 2 }} />) : 
                 stats?.recentOrders?.length === 0 ? (
                   <Typography variant="caption" sx={{ color: '#94a3b8', py: 2, display: 'block', textAlign: 'center' }}>Chưa có đơn hàng.</Typography>
                 ) : (
                  stats?.recentOrders.slice(0, 4).map((order) => (
                    <Box key={order.id} sx={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      p: 1.2, borderRadius: 2, border: '1px solid #f1f5f9',
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.product?.title}</Typography>
                          <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, fontSize: '0.6rem' }}>@{order.buyer?.username}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a', fontSize: '0.7rem' }}>{order.amount.toLocaleString()}đ</Typography>
                        <Chip 
                          label={getOrderStatusStyles(order.status).label === 'HOÀN THÀNH' ? 'XONG' : getOrderStatusStyles(order.status).label === 'TẠM GIỮ' ? 'GIỮ' : getOrderStatusStyles(order.status).label} 
                          size="small"
                          sx={{ 
                            height: 18, fontSize: '0.6rem', fontWeight: 800,
                            bgcolor: getOrderStatusStyles(order.status).bg,
                            color: getOrderStatusStyles(order.status).color
                          }} 
                        />
                      </Box>
                    </Box>
                  ))
                 )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </SellerLayout>
  );
}
