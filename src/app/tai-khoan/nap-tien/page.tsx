'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  Alert, CircularProgress, Divider, List, ListItem, ListItemText,
  Breadcrumbs, Link as MuiLink
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import SiteLayout from '@/components/layout/SiteLayout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function DepositPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/me/transactions?userId=${user.id}`, { credentials: 'same-origin' });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCreatePayment = async () => {
    if (!amount || parseInt(amount) < 10000) {
      setError('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, amount: parseInt(amount) })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentData(data);
        fetchHistory(); // Refresh history to show pending
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = paymentData ? 
    `https://img.vietqr.io/image/${paymentData.bankInfo.bankName.replace(/ /g, '')}-${paymentData.bankInfo.accountNumber}-compact.png?amount=${paymentData.amount}&addInfo=${paymentData.paymentCode}&accountName=${encodeURIComponent(paymentData.bankInfo.accountHolder)}` 
    : '';

  return (
    <SiteLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/" color="inherit" underline="hover">Trang chủ</MuiLink>
          <MuiLink component={Link} href="/tai-khoan" color="inherit" underline="hover">Tài khoản</MuiLink>
          <Typography color="text.primary">Nạp tiền</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Typography variant="h5" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                <AccountBalanceWalletIcon color="primary" /> Nạp tiền vào tài khoản
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Hệ thống nạp tiền tự động qua ngân hàng 24/7. Tiền sẽ được cộng vào tài khoản sau 1-3 phút.
              </Typography>

              {!paymentData ? (
                <>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>Chọn hoặc nhập số tiền muốn nạp (VND)</Typography>
                  <Grid container spacing={1} mb={3}>
                    {PRESET_AMOUNTS.map((v) => (
                      <Grid size={{ xs: 4 }} key={v}>
                        <Button
                          fullWidth
                          variant={amount === v.toString() ? "contained" : "outlined"}
                          onClick={() => setAmount(v.toString())}
                          sx={{ borderRadius: 2, py: 1 }}
                        >
                          {v.toLocaleString('vi-VN')}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  <TextField
                    fullWidth
                    label="Số tiền muốn nạp"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="VD: 100000"
                    sx={{ mb: 3 }}
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">VND</Typography>,
                    }}
                  />

                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCreatePayment}
                    disabled={loading || !user}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Tiếp tục thanh toán'}
                  </Button>
                </>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                    Vui lòng chuyển đúng số tiền và nội dung bên dưới để được cộng tiền tự động.
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">NGÂN HÀNG</Typography>
                      <Typography variant="body1" fontWeight={700} gutterBottom>{paymentData.bankInfo.bankName}</Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>SỐ TÀI KHOẢN</Typography>
                      <Typography variant="h6" fontWeight={800} color="primary" gutterBottom>{paymentData.bankInfo.accountNumber}</Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>CHỦ TÀI KHOẢN</Typography>
                      <Typography variant="body1" fontWeight={700} gutterBottom>{paymentData.bankInfo.accountHolder}</Typography>

                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="caption" color="text.secondary" display="block">SỐ TIỀN</Typography>
                      <Typography variant="h5" fontWeight={800} color="error">{paymentData.amount.toLocaleString('vi-VN')}đ</Typography>

                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>NỘI DUNG CHUYỂN KHOẢN</Typography>
                      <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px dashed #0ea5e9', mt: 1, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={900} color="#0369a1" letterSpacing={1}>
                          {paymentData.paymentCode}
                        </Typography>
                        <Typography variant="caption" color="#0369a1" fontWeight={600}>Copy đúng chính xác nội dung này</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, mb: 1, textAlign: 'center' }}>
                        <img src={qrUrl} alt="VietQR" style={{ width: '100%', maxWidth: 200 }} />
                        <Typography variant="caption" display="block" color="text.secondary" mt={1}>Quét mã để thanh toán nhanh</Typography>
                      </Box>
                      <Button variant="text" size="small" startIcon={<QrCode2Icon />} onClick={() => setPaymentData(null)}>
                        Đổi số tiền nạp
                      </Button>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4, p: 2, bgcolor: '#fff7ed', borderRadius: 2, display: 'flex', gap: 2 }}>
                    <InfoIcon sx={{ color: '#ea580c' }} />
                    <Typography variant="body2" color="#9a3412">
                      <strong>Lưu ý:</strong> Tiền sẽ được cộng tự động sau 1-5 phút khi hệ thống nhận được tiền. 
                      Nếu sau 15 phút chưa thấy cộng tiền, vui lòng liên hệ Admin kèm theo ảnh chụp biên lai.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                <HistoryIcon color="primary" /> Lịch sử nạp tiền
              </Typography>
              
              <Box sx={{ flex: 1, mt: 2 }}>
                {loadingHistory ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>
                ) : transactions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>Chưa có giao dịch nào.</Typography>
                ) : (
                  <List disablePadding>
                    {transactions.map((t, idx) => (
                      <React.Fragment key={t.id}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" fontWeight={700}>
                                  {t.type === 'DEPOSIT' ? 'Nạp tiền' : 'Chi tiêu'}
                                </Typography>
                                <Typography variant="body2" fontWeight={800} color={t.status === 'SUCCESS' ? 'success.main' : t.status === 'PENDING' ? 'warning.main' : 'error.main'}>
                                  {t.type === 'DEPOSIT' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}đ
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box display="flex" justifyContent="space-between" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  {format(new Date(t.createdAt), 'HH:mm dd/MM/yyyy')}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  px: 1, borderRadius: 1, 
                                  bgcolor: t.status === 'SUCCESS' ? '#f0fdf4' : t.status === 'PENDING' ? '#fffbeb' : '#fef2f2',
                                  color: t.status === 'SUCCESS' ? '#166534' : t.status === 'PENDING' ? '#92400e' : '#991b1b'
                                }}>
                                  {t.status === 'SUCCESS' ? 'Thành công' : t.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {idx < transactions.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
              
              <Button fullWidth href="/tai-khoan/giao-dich" sx={{ mt: 2, color: 'text.secondary' }}>Xem tất cả giao dịch</Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </SiteLayout>
  );
}
