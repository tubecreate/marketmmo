'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Switch, FormControlLabel,
  Divider, InputAdornment, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AdminLayout from '@/components/layout/AdminLayout';
import { toast } from 'sonner';

interface SystemConfig {
  maxBoothsPerSeller: number;
  maxItemsPerOrder: number;
  commissionRate: number;
  minWithdrawAmount: number;
  maintenanceMode: boolean;
  sepayApiKey?: string;
  sepayMerchantId?: string;
  sepayWebhookSecret?: string;
  bankAccount?: string;
  bankName?: string;
  bankOwner?: string;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (res.ok && data.config) setConfig(data.config);
    } catch {
      toast.error('Lỗi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Lưu cấu hình thành công!');
        setConfig(data.config);
      } else {
        toast.error(data.error || 'Lỗi lưu cấu hình');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemConfig, value: any) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) return <AdminLayout><Typography>Đang tải...</Typography></AdminLayout>;
  if (!config) return <AdminLayout><Alert severity="error">Không thể tải cấu hình</Alert></AdminLayout>;

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#1e293b' }}>
          Cài đặt hệ thống
        </Typography>

        <Grid container spacing={3}>
          {/* Global Config */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0f172a' }}>
                Cấu hình chung
              </Typography>
              <form onSubmit={handleSave}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="Giới hạn gian hàng / người bán" type="number"
                      value={config.maxBoothsPerSeller}
                      onChange={(e) => handleChange('maxBoothsPerSeller', Number(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="Giới hạn keys, ngâm / đơn hàng" type="number"
                      value={config.maxItemsPerOrder}
                      onChange={(e) => handleChange('maxItemsPerOrder', Number(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="Hoa hồng sàn" type="number"
                      value={config.commissionRate}
                      onChange={(e) => handleChange('commissionRate', Number(e.target.value))}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="Rút tiền tối thiểu" type="number"
                      value={config.minWithdrawAmount}
                      onChange={(e) => handleChange('minWithdrawAmount', Number(e.target.value))}
                      InputProps={{ endAdornment: <InputAdornment position="end">đ</InputAdornment> }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.maintenanceMode}
                          onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600, color: config.maintenanceMode ? '#dc2626' : '#64748b' }}>
                          Chế độ bảo trì hệ thống (Khóa toàn bộ giao dịch)
                        </Typography>
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                      Cấu hình Nạp tiền & QR Code
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Do API Gateway không tự động cung cấp thông tin tài khoản ngân hàng, bạn cần nhập thông tin bằng tay để hiển thị mã QR trên trang Nạp tiền.
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth label="Tên Ngân Hàng (VD: Vietcombank)"
                      value={config.bankName || ''}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth label="Số Tài Khoản"
                      value={config.bankAccount || ''}
                      onChange={(e) => handleChange('bankAccount', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth label="Tên Chủ Tài Khoản"
                      value={config.bankOwner || ''}
                      onChange={(e) => handleChange('bankOwner', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="SePay Merchant ID"
                      value={config.sepayMerchantId || ''}
                      onChange={(e) => handleChange('sepayMerchantId', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="VD: SP-LIVE-TQA292B6"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="SePay Webhook Secret" type="password"
                      value={config.sepayWebhookSecret || ''}
                      onChange={(e) => handleChange('sepayWebhookSecret', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="VD: spsk_live_oHFK..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit" variant="contained" disabled={saving}
                      startIcon={<SaveIcon />}
                      sx={{ py: 1.5, px: 4, borderRadius: 2, fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Intro to Overrides */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#334155' }}>
                Ngoại lệ thành viên
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mb: 3, lineHeight: 1.6 }}>
                Bạn có thể thiết lập các thông số riêng biệt (Hoa hồng, Giới hạn) cho từng thành viên cụ thể. 
                Ngoại lệ sẽ ghi đè lên cài đặt chung.
              </Typography>
              <Button variant="outlined" sx={{ borderRadius: 2 }} fullWidth>
                Quản lý ngoại lệ ngay
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
