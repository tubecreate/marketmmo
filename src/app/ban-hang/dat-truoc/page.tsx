'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Chip, TextField, InputAdornment,
  Skeleton, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider
} from '@mui/material';
// import { toast } from 'sonner';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CloseIcon from '@mui/icons-material/Close';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import QuickChatDialog from '@/components/chat/QuickChatDialog';

const STATUS_TABS = [
  { label: 'Đang đặt trước', value: 'PRE_ORDER' },
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
];

export default function SellerPreOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('PRE_ORDER');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [targetChatUser, setTargetChatUser] = useState<any>(null);

  const handleOpenChat = (buyer: any) => {
    if (!buyer?.id) return;
    setTargetChatUser({ id: buyer.id, username: buyer.username, avatar: buyer.avatar });
    setChatOpen(true);
  };

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const stored = localStorage.getItem('mmo_user');
      const localUser = stored ? JSON.parse(stored) : null;
      const uid = user?.id || localUser?.id;
      if (!uid) return;

      const res = await fetch(`/api/me/seller-orders?userId=${uid}&status=${tabValue}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      
      if (detailOpen && selectedOrder) {
        const newest = data.find((o: any) => o.id === selectedOrder.id);
        if (newest) setSelectedOrder(newest);
      }
    } catch (err) {
      console.error('Fetch seller pre-orders error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id, tabValue, detailOpen, selectedOrder]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.product?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.buyer?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    // EXCLUSIVELY Pre-Orders or filtered by status
    if (tabValue === 'all') {
        return matchSearch && o.status === 'PRE_ORDER'; // Even in 'all' we might want to restrict to pre-order capable items if needed, but for now just follow status
    }
    return matchSearch;
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'PRE_ORDER': return <Chip label="Đang chờ hàng" size="small" sx={{ fontWeight: 600, bgcolor: '#fff7ed', color: '#9a3412', border: '1px solid #ffedd5', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'COMPLETED': return <Chip label="Đã bàn giao" size="small" sx={{ fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'CANCELLED': return <Chip label="Đã huỷ" size="small" sx={{ fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.7rem', borderRadius: 1 }} />;
      default: return <Chip label={status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
    }
  };

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ bgcolor: '#16a34a', p: 3.5, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, color: 'white' }}>Đơn hàng đặt trước</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>Quản lý các đơn hàng khách hàng đã đặt trước và đang chờ bạn xử lý</Typography>
          </Box>
          <ViewInArIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 60 }} />
        </Box>

        <Paper elevation={0} sx={{ p: 0, borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', bgcolor: 'white', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, v) => setTabValue(v)}
              sx={{
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.85rem', minHeight: 60 },
                '& .Mui-selected': { color: '#16a34a !important' },
                '& .MuiTabs-indicator': { bgcolor: '#16a34a', height: 3 }
              }}
            >
              {STATUS_TABS.map(tab => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
            <TextField
              sx={{ flex: 1 }}
              placeholder="Tìm theo mã đơn, tên sản phẩm hoặc người mua..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: 'white' }
              }}
            />
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#fffbeb' }}>
                <TableRow sx={{ '& th': { whiteSpace: 'nowrap', textTransform: 'none', px: 1, py: 1.5 } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Thao tác</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Ngày đặt</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Người mua</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }} align="center">SL</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Tổng tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}><TableCell colSpan={8}><Skeleton height={50} /></TableCell></TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>Không tìm thấy đơn hàng đặt trước nào.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', px: 1, py: 1 } }}>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleOpenChat(order.buyer)}
                          disabled={!order.buyer?.id}
                        >
                          <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                      <TableCell onClick={() => handleOpenDetail(order)} sx={{ cursor: 'pointer' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb', fontSize: '0.75rem', textDecoration: 'underline' }}>
                          {order.id.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                         <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{order.buyer?.username}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.product?.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{order.quantity || 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                          {(order.amount).toLocaleString('vi-VN')}đ
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(order.status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Chi tiết đơn đặt trước</Typography>
          <IconButton onClick={() => setDetailOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                 <ViewInArIcon sx={{ color: '#d97706' }} />
                 <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedOrder.product?.title}</Typography>
                    <Typography variant="caption">{selectedOrder.variantName || 'Mặc định'}</Typography>
                 </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                 <Typography variant="body2" color="text.secondary">Người mua:</Typography>
                 <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedOrder.buyer?.username}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                 <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                 <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedOrder.quantity}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                 <Typography variant="body2" color="text.secondary">Tổng tiền:</Typography>
                 <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>{selectedOrder.amount.toLocaleString('vi-VN')}đ</Typography>
              </Box>
              <Divider />
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                * Đơn hàng này đang ở trạng thái đặt trước. Bạn cần chuẩn bị hàng và bàn giao cho khách hàng sớm nhất có thể.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} fullWidth variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <QuickChatDialog open={chatOpen} onClose={() => setChatOpen(false)} targetUser={targetChatUser} />
    </SellerLayout>
  );
}
