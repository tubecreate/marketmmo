'use client';
import React, { useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  Box, Container, Grid, Paper, Typography, Button, TextField,
  InputAdornment, Alert, Chip, Divider, alpha, Tab, Tabs,
} from '@mui/material';
import AddCardIcon from '@mui/icons-material/AddCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

export default function NapTienPage() {
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const selectedAmount = Number(amount.replace(/\D/g, ''));
  const bankInfo = {
    bank: 'MB Bank (MBBank)',
    accountNumber: '1234567890',
    accountName: 'MARKETMMO PLATFORM',
    content: `NAP ${selectedAmount || '100000'} USERID123`,
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatVND = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? Number(num).toLocaleString('vi-VN') : '';
  };

  return (
    <SiteLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
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
          <AddCardIcon sx={{ fontSize: 36, opacity: 0.9 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Nạp Tiền Tự Động</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Chuyển khoản ngân hàng – Cộng tiền trong vòng 30 giây</Typography>
          </Box>
          <Box sx={{ ml: 'auto', textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Số dư hiện tại</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>0 VNĐ</Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Left: Amount input */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                1. Chọn số tiền nạp
              </Typography>

              <TextField
                fullWidth
                label="Số tiền (VNĐ)"
                value={formatVND(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="100,000"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              {/* Quick amounts */}
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Chọn nhanh:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                {quickAmounts.map((a) => (
                  <Chip
                    key={a}
                    label={`${(a / 1000).toFixed(0)}k`}
                    onClick={() => setAmount(String(a))}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: selectedAmount === a ? '#16a34a' : alpha('#16a34a', 0.08),
                      color: selectedAmount === a ? 'white' : '#16a34a',
                      fontWeight: 600,
                      border: `1px solid ${selectedAmount === a ? '#16a34a' : alpha('#16a34a', 0.2)}`,
                      '&:hover': { bgcolor: selectedAmount === a ? '#15803d' : alpha('#16a34a', 0.15) },
                    }}
                  />
                ))}
              </Box>

              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, fontSize: '0.78rem', borderColor: alpha('#16a34a', 0.3) }}
                icon={<InfoOutlinedIcon sx={{ fontSize: 18, color: '#16a34a' }} />}
              >
                <strong>Tích lũy không giới hạn!</strong> Nạp bao nhiêu cũng được, số dư không hết hạn.
              </Alert>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Lịch sử nạp tiền gần đây</Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Chưa có lịch sử nạp tiền
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Right: QR + Bank transfer */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                2. Chuyển khoản ngân hàng
              </Typography>

              {/* QR Code placeholder */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    border: '3px solid #16a34a',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f0fdf4',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <QrCode2Icon sx={{ fontSize: 100, color: '#16a34a', opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, mt: 1 }}>
                    {selectedAmount ? `${selectedAmount.toLocaleString('vi-VN')}đ` : 'Nhập số tiền'}
                  </Typography>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      right: 8,
                      bgcolor: '#16a34a',
                      borderRadius: 1,
                      py: 0.25,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem' }}>
                      SEPAY · QR CHUYỂN KHOẢN
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Bank info */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Ngân hàng', value: bankInfo.bank, key: 'bank' },
                  { label: 'Số tài khoản', value: bankInfo.accountNumber, key: 'acc', highlight: true },
                  { label: 'Chủ tài khoản', value: bankInfo.accountName, key: 'name' },
                  { label: 'Nội dung chuyển khoản', value: bankInfo.content, key: 'content', highlight: true, important: true },
                ].map((row) => (
                  <Box
                    key={row.key}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: row.important ? '#f0fdf4' : '#f8fafc',
                      border: '1px solid',
                      borderColor: row.important ? '#bbf7d0' : 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        {row.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: row.highlight ? 700 : 500,
                          color: row.important ? '#16a34a' : 'text.primary',
                          fontSize: '0.9rem',
                        }}
                      >
                        {row.value}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={copied === row.key ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : <ContentCopyIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => handleCopy(row.value, row.key)}
                      sx={{
                        color: copied === row.key ? '#16a34a' : 'text.secondary',
                        fontSize: '0.72rem',
                        minWidth: 'auto',
                      }}
                    >
                      {copied === row.key ? 'Đã chép' : 'Sao chép'}
                    </Button>
                  </Box>
                ))}
              </Box>

              <Alert
                severity="warning"
                sx={{ mt: 2.5, borderRadius: 2, fontSize: '0.78rem' }}
              >
                ⚠️ <strong>Quan trọng:</strong> Nhập <strong>đúng nội dung chuyển khoản</strong> để hệ thống tự động cộng số dư. Sai nội dung sẽ không được xử lý tự động.
              </Alert>

              {/* Steps */}
              <Box sx={{ mt: 2.5 }}>
                {[
                  'Quét mã QR hoặc chuyển khoản với thông tin trên',
                  'Nhập đúng nội dung chuyển khoản',
                  'Số dư tự động cộng trong vòng 30 giây',
                ].map((step, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: '#16a34a',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </SiteLayout>
  );
}
