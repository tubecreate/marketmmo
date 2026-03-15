'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, Button, 
  TextField, Radio, RadioGroup, FormControlLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Divider, Alert, CircularProgress, useTheme
} from '@mui/material';
import { Shield, History, Wallet, ArrowUpCircle, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import SellerLayout from '@/components/layout/SellerLayout';

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN');
}

export default function InsurancePage() {
  const theme = useTheme();
  // Using a simplified way to get userId for now, similar to other pages in the project
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [source, setSource] = useState<'MAIN' | 'SHOP'>('SHOP');
  const [amount, setAmount] = useState<string>('50000');

  useEffect(() => {
    if (user?.id) {
      fetchInsuranceData();
    }
  }, [user?.id]);

  const fetchInsuranceData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/seller/insurance?userId=${user.id}`);
      setData(res.data);
    } catch (error) {
      console.error('Fetch insurance error:', error);
      toast.error('Không thể tải thông tin quỹ bảo hiểm');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 50000) {
      toast.error('Số tiền tối thiểu là 50.000đ');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/seller/insurance', {
        userId: user.id,
        action,
        amount: numAmount,
        source
      });
      toast.success(action === 'DEPOSIT' ? 'Nạp quỹ thành công' : 'Rút quỹ thành công');
      fetchInsuranceData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi xử lý giao dịch');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography>Vui lòng đăng nhập để xem thông tin bảo hiểm.</Typography>
      </Container>
    );
  }

  return (
    <SellerLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            py: 3
          }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ p: 1.5, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                <Shield size={32} />
              </Box>
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              SỐ DƯ QUỸ BẢO HIỂM
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color: '#1e293b' }}>
              {formatPrice(data?.insuranceBalance || 0)} <Typography component="span" variant="h5">VNĐ</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Để được bảo vệ an toàn
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ color: '#f43f5e' }}><AlertCircle size={20} /></Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Quyền Lợi Quỹ Bảo Hiểm</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {[
                  { title: "Tăng độ Uy tín (Trust)", desc: "Khách hàng tin tưởng hơn khi thấy Shop có quỹ bảo đảm rủi ro.", icon: <Shield size={18} />, color: "#eab308" },
                  { title: "Huy hiệu 'Bảo hiểm'", desc: "Sản phẩm được gắn nhãn bảo vệ đặc biệt, nổi bật hơn đối thủ.", icon: <Shield size={18} />, color: "#3b82f6" },
                  { title: "Mở khóa Bảo hành dài hạn", desc: "Đủ điều kiện đăng bán các sản phẩm có bảo hành trên 3 ngày.", icon: <History size={18} />, color: "#10b981" },
                  { title: "Linh hoạt Nạp/Rút", desc: "Tiền vẫn là của bạn. Có thể rút về Ví chính bất cứ lúc nào.", icon: <Wallet size={18} />, color: "#8b5cf6" },
                ].map((item, idx) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ color: item.color, mt: 0.5 }}>{item.icon}</Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Transaction Management */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase' }}>
            QUẢN LÝ GIAO DỊCH
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button 
              variant={action === 'DEPOSIT' ? 'contained' : 'outlined'} 
              onClick={() => setAction('DEPOSIT')}
              fullWidth
              sx={{ py: 1.5, borderRadius: 2, bgcolor: action === 'DEPOSIT' ? '#fbbf24' : 'transparent', color: action === 'DEPOSIT' ? '#000' : 'inherit', border: action === 'DEPOSIT' ? 'none' : '1px solid #e2e8f0' }}
              startIcon={<ArrowUpCircle size={18} />}
            >
              Nạp Quỹ
            </Button>
            <Button 
              variant={action === 'WITHDRAW' ? 'contained' : 'outlined'} 
              onClick={() => setAction('WITHDRAW')}
              fullWidth
              sx={{ py: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', color: 'inherit' }}
              startIcon={<History size={18} />}
            >
              Rút về Ví
            </Button>
          </Box>

          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, textAlign: 'center', background: '#f59e0b', color: '#fff' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Info size={16} /> {action === 'DEPOSIT' ? 'NẠP TIỀN VÀO QUỸ BẢO HIỂM' : 'RÚT TIỀN TỪ QUỸ BẢO HIỂM'}
              </Typography>
            </Box>
            
            <Alert severity="warning" variant="filled" sx={{ m: 2, borderRadius: 2, bgcolor: '#f59e0b' }}>
              Số dư Quỹ hiển thị CÔNG KHAI cho khách xem. Điều này giúp khẳng định UY TÍN tuyệt đối của Shop!
            </Alert>

            <Box sx={{ p: 3 }}>
              {action === 'DEPOSIT' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                    Chọn nguồn tiền:
                  </Typography>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup value={source} onChange={(e) => setSource(e.target.value as any)}>
                      <Box sx={{ 
                        border: '1px solid #fef3c7', 
                        bgcolor: source === 'SHOP' ? '#fffbeb' : '#fff', 
                        borderRadius: 2, 
                        p: 1.5, 
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <FormControlLabel value="SHOP" control={<Radio color="warning" />} label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ví số dư SHOP</Typography>
                            <Typography variant="caption">Số dư: {formatPrice(data?.holdBalance || 0)}</Typography>
                          </Box>
                        } />
                        <Box sx={{ color: '#f87171' }}><Wallet size={20} /></Box>
                      </Box>

                      <Box sx={{ 
                        border: '1px solid #f1f5f9', 
                        bgcolor: source === 'MAIN' ? '#f8fafc' : '#fff', 
                        borderRadius: 2, 
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <FormControlLabel value="MAIN" control={<Radio color="primary" />} label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ví Chính</Typography>
                            <Typography variant="caption">Số dư: {formatPrice(data?.balance || 0)}</Typography>
                          </Box>
                        } />
                        <Box sx={{ color: '#3b82f6' }}><ArrowUpCircle size={20} /></Box>
                      </Box>
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                Số tiền {action === 'DEPOSIT' ? 'nạp' : 'rút'}
              </Typography>
              <TextField
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min: 50.000đ"
                sx={{ mb: 3 }}
                type="number"
                InputProps={{
                  endAdornment: <Typography variant="caption" sx={{ fontWeight: 700 }}>đ</Typography>
                }}
              />

              <Button 
                fullWidth 
                variant="contained" 
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, bgcolor: '#fbbf24', '&:hover': { bgcolor: '#f59e0b' }, color: '#000' }}
                onClick={handleAction}
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : `XÁC NHẬN ${action === 'DEPOSIT' ? 'NẠP' : 'RÚT'} NGAY`}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* History */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>LỊCH SỬ GIAO DỊCH QUỸ</Typography>
            <Box sx={{ bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>20 GIAO DỊCH GẦN NHẤT</Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>THỜI GIAN</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>LOẠI</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>SỐ TIỀN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.transactions?.length > 0 ? (
                  data.transactions.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            p: 0.5, 
                            borderRadius: 1, 
                            bgcolor: tx.type === 'INSURANCE_DEPOSIT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: tx.type === 'INSURANCE_DEPOSIT' ? '#10b981' : '#ef4444'
                          }}>
                            {tx.type === 'INSURANCE_DEPOSIT' ? <ArrowUpCircle size={14} /> : <History size={14} />}
                          </Box>
                          <Typography variant="body2">{tx.description || tx.type}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        fontWeight: 700, 
                        color: tx.type === 'INSURANCE_DEPOSIT' ? '#10b981' : '#ef4444' 
                      }}>
                        {tx.type === 'INSURANCE_DEPOSIT' ? '+' : '-'}{formatPrice(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                      Chưa có giao dịch nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
    </SellerLayout>
  );
}
