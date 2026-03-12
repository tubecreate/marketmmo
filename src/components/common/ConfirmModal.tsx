'use client';
import React from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Button, Typography, Box, alpha
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'info';
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'info',
  loading = false
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger': return <WarningAmberRoundedIcon sx={{ fontSize: 40, color: '#ef4444' }} />;
      case 'success': return <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40, color: '#22c55e' }} />;
      default: return <InfoOutlinedIcon sx={{ fontSize: 40, color: '#3b82f6' }} />;
    }
  };

  const getThemeColor = () => {
    switch (variant) {
      case 'danger': return '#ef4444';
      case 'success': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          p: 1,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }
      }}
    >
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box sx={{ 
          display: 'inline-flex', 
          p: 2, 
          borderRadius: '50%', 
          bgcolor: alpha(getThemeColor(), 0.1),
          mb: 2.5
        }}>
          {getIcon()}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, px: 2 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1.5, justifyContent: 'center' }}>
        <Button 
          fullWidth
          variant="outlined" 
          onClick={onClose}
          sx={{ 
            borderRadius: 2.5, 
            py: 1.2, 
            fontWeight: 700,
            textTransform: 'none',
            color: '#64748b',
            borderColor: '#e2e8f0',
            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
          }}
        >
          {cancelLabel}
        </Button>
        <Button 
          fullWidth
          variant="contained" 
          disableElevation
          onClick={onConfirm}
          disabled={loading}
          sx={{ 
            borderRadius: 2.5, 
            py: 1.2, 
            fontWeight: 700,
            textTransform: 'none',
            bgcolor: getThemeColor(),
            '&:hover': { bgcolor: alpha(getThemeColor(), 0.8) }
          }}
        >
          {loading ? 'Đang xử lý...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
