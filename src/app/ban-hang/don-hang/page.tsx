'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Chip, TextField, InputAdornment,
  Skeleton, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, alpha
} from '@mui/material';
import { toast } from 'sonner';
import SearchIcon from '@mui/icons-material/Search';
// import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import QuickChatDialog from '@/components/chat/QuickChatDialog';

const STATUS_TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Tạm giữ', value: 'HOLDING' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Khiếu nại', value: 'DISPUTED' },
  { label: 'Đã hoàn tiền', value: 'REFUNDED' },
];

export default function SellerOrdersPage() {
  // const router = useRouter(); // Removed unused router
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]); // Using any intentionally for high-speed development of complex joined objects
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Quick Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [targetChatUser, setTargetChatUser] = useState<{ id: string; username: string; avatar?: string | null } | null>(null);

  const handleOpenChat = (buyer: any) => {
    if (!buyer?.id) return;
    setTargetChatUser({ id: buyer.id, username: buyer.username, avatar: buyer.avatar });
    setChatOpen(true);
  };

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mmo_user');
      const localUser = stored ? JSON.parse(stored) : null;
      const uid = user?.id || localUser?.id;
      if (!uid) return;

      const res = await fetch(`/api/me/seller-orders?userId=${uid}&status=${tabValue}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch seller orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, tabValue]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) setSearchTerm(q);
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.product?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.buyer?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'HOLDING': return <Chip label="Tạm giữ tiền" size="small" sx={{ fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'COMPLETED': return <Chip label="Hoàn thành" size="small" sx={{ fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'DISPUTED': return <Chip label="Khiếu nại" size="small" sx={{ fontWeight: 600, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.7rem', borderRadius: 1 }} />;
      case 'REFUNDED': return <Chip label="Hoàn tiền" size="small" sx={{ fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.7rem', borderRadius: 1 }} />;
      default: return <Chip label={status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
    }
  };

  return (
    <SellerLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Green Header Box */}
        <Box sx={{ bgcolor: '#16a34a', p: 3.5, borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, color: 'white' }}>Đơn hàng đã bán</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Theo dõi và quản lý lịch sử giao dịch của bạn</Typography>
          </Box>
          <Button
            variant="contained" disableElevation
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            sx={{ borderRadius: 2, fontWeight: 900, px: 2, py: 1, bgcolor: 'white', color: '#16a34a', fontSize: '0.75rem', '&:hover': { bgcolor: '#f1f5f9' } }}
          >
            LÀM MỚI
          </Button>
        </Box>

        <Paper elevation={0} sx={{ p: 0, borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', bgcolor: 'white', overflow: 'hidden' }}>
          {/* Tabs Section */}
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

          {/* Search Row */}
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
              <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                <TableRow sx={{ '& th': { whiteSpace: 'nowrap', textTransform: 'none', px: 1, py: 1.5 } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Thao tác</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Ngày bán</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Người mua</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Gian hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Mặt hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }} align="center">SL</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Giá</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Đã giảm</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Tổng tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Hoàn tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Sàn</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton height={50} /></TableCell></TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>Không tìm thấy đơn hàng nào.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', px: 1, py: 1 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0 }}>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            sx={{ p: 0.2 }}
                            onClick={() => handleOpenChat(order.buyer)}
                            disabled={!order.buyer?.id}
                          >
                            <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" color="success" sx={{ p: 0.2 }}>
                            <AddBoxOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell onClick={() => handleOpenDetail(order)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha('#2563eb', 0.05) } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb', fontSize: '0.75rem', textDecoration: 'underline' }}>
                          {order.id.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.2 }}>
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}<br/>
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          onClick={() => handleOpenChat(order.buyer)}
                          sx={{ 
                            fontSize: '0.75rem', 
                            color: order.buyer?.id ? '#2563eb' : '#334155', 
                            textDecoration: order.buyer?.id ? 'underline' : 'none', 
                            fontWeight: order.buyer?.id ? 600 : 400,
                            cursor: order.buyer?.id ? 'pointer' : 'default',
                            p: 0.5, borderRadius: 1,
                            '&:hover': { bgcolor: order.buyer?.id ? alpha('#2563eb', 0.05) : 'transparent' }
                          }}
                        >
                          {order.buyer?.username}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#2563eb', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.product?.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#334155', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.variantName || 'Mặc định'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{order.quantity || 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {(order.amount / (order.quantity || 1)).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {(order.amount).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>0</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                          {(order.fee || 0).toLocaleString('vi-VN')}
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
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Chi tiết đơn hàng</Typography>
            <Typography variant="caption" color="text.secondary">Mã đơn: #{selectedOrder?.id.toUpperCase()}</Typography>
          </Box>
          <IconButton onClick={() => setDetailOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {selectedOrder && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  {selectedOrder.product?.thumbnail ? (
                    <Box component="img" src={selectedOrder.product.thumbnail} sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ width: 64, height: 64, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</Box>
                  )}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedOrder.product?.title}</Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>{selectedOrder.variantName || 'Mặc định'}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ gridColumn: 'span 6' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>NGƯỜI MUA</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.buyer?.username}</Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 6' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TRẠNG THÁI</Typography>
                <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedOrder.status)}</Box>
              </Box>

              <Box sx={{ gridColumn: 'span 6' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>NGÀY MUA</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 6' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>HẾT HẠN BẢO HÀNH</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                  {selectedOrder.warrantyExpire ? new Date(selectedOrder.warrantyExpire).toLocaleDateString('vi-VN') : 'Không có'}
                </Typography>
              </Box>

              <Box sx={{ gridColumn: 'span 12' }}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>NỘI DUNG BÀN GIAO</Typography>
                  <Button 
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />} 
                    size="small" 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.deliveredContent || '');
                      toast.success('Đã sao chép nội dung!');
                    }}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Sao chép
                  </Button>
                </Box>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#1e293b', 
                  color: '#f1f5f9', 
                  borderRadius: 2, 
                  fontFamily: 'monospace', 
                  fontSize: '0.7rem',
                  maxHeight: 200,
                  overflow: 'auto',
                  whiteSpace: 'pre',
                }}>
                  {selectedOrder.deliveredContent || 'Chưa cập nhật nội dung'}
                </Box>
              </Box>

              <Box sx={{ gridColumn: 'span 12' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Thanh toán ({selectedOrder.quantity || 1} sản phẩm)</Typography>
                  <Typography variant="h6" sx={{ color: '#166534', fontWeight: 900 }}>
                    {selectedOrder.amount.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} fullWidth variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Chat Dialog */}
      <QuickChatDialog 
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        targetUser={targetChatUser}
      />
    </SellerLayout>
  );
}
