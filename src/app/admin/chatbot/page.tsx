'use client';
import React from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Divider, Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SaveIcon from '@mui/icons-material/Save';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminChatbotPage() {
  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <SmartToyIcon sx={{ fontSize: 32, color: '#0ea5e9' }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Cấu hình Chatbot AI
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
          Tính năng Chatbot đang được nâng cấp. Bạn có thể thiết lập trước các thông số nhận diện cho Bot tại đây.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0f172a' }}>
                Prompt System & Context
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Tên gọi của Bot" defaultValue="MarketMMO Assistant"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="System Prompt (Định hướng AI)" multiline rows={6}
                    defaultValue="Bạn là trợ lý ảo của sàn MarketMMO. Nhiệm vụ của bạn là giải đáp thắc mắc của người dùng về giao dịch, nạp tiền, và tạo gian hàng. Hãy trả lời ngắn gọn, lịch sự và chuyên nghiệp."
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Độ sáng tạo (Temperature)" type="number" defaultValue="0.7"
                    inputProps={{ min: 0, max: 2, step: 0.1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Button
                    variant="contained" startIcon={<SaveIcon />}
                    sx={{ py: 1.5, px: 4, borderRadius: 2, fontWeight: 700, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
                  >
                    Lưu cấu hình Bot
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#f0f9ff', border: '1px dashed #7dd3fc', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#0369a1' }}>
                Lịch sử Chat Log
              </Typography>
              <Typography variant="body2" sx={{ color: '#0c4a6e', mb: 3, lineHeight: 1.6 }}>
                Tra cứu lịch sử trò chuyện của người dùng với Chatbot để cải thiện Prompt và theo dõi chất lượng hỗ trợ.
              </Typography>
              <Button variant="outlined" sx={{ borderRadius: 2, color: '#0284c7', borderColor: '#38bdf8' }} fullWidth disabled>
                Tính năng sắp ra mắt
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
