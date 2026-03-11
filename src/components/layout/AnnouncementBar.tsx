'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';

const announcements = [
  '🔒 Sàn bảo vệ người mua với cơ chế Escrow – Tiền tạm giữ 03 ngày bảo hành',
  '🚀 Đăng ký bán hàng miễn phí – Tiếp cận hàng ngàn khách hàng ngay hôm nay!',
  '💬 Hỗ trợ 24/7 qua AI Chatbot – Giải đáp mọi thắc mắc tức thì',
  '⚡ Nạp tiền tự động qua SePay – Cộng số dư trong vòng 30 giây',
];

export default function AnnouncementBar() {
  const [message, setMessage] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        bgcolor: '#0f172a',
        color: 'white',
        px: 3,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Container maxWidth="xl" sx={{ height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Blinking dot + label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              animation: 'pulse 2s ease infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          />
          <Typography sx={{ fontWeight: 700, color: '#22c55e', fontSize: '0.68rem', letterSpacing: 0.8 }}>
            THÔNG BÁO
          </Typography>
        </Box>

        {/* Separator */}
        <Box sx={{ width: '1px', height: 16, bgcolor: '#1e293b' }} />

        {/* Scrolling text */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', height: 20 }}>
          <Typography
            key={currentIdx}
            sx={{
              position: 'absolute',
              whiteSpace: 'nowrap',
              fontSize: '0.76rem',
              color: '#cbd5e1',
              lineHeight: '20px',
              animation: 'slideIn 0.4s ease',
              '@keyframes slideIn': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {announcements[currentIdx]}
          </Typography>
        </Box>

        {/* Separator */}
        <Box sx={{ width: '1px', height: 16, bgcolor: '#1e293b', display: { xs: 'none', md: 'block' } }} />

        {/* Chat input */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>Chat thế giới:</Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 1.5,
              px: 1.25,
              height: 26,
              gap: 0.75,
              '&:focus-within': { borderColor: '#16a34a' },
            }}
          >
            <input
              placeholder="Nhắn tin..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e2e8f0',
                fontSize: '0.72rem',
                width: 160,
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
