'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Button, Typography, Box, CircularProgress,
  IconButton, Divider, Alert, Paper, Chip, Tab, Tabs,
  MenuItem, Select, FormControl,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InventoryIcon from '@mui/icons-material/Inventory';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface StockItem { id: string; content: string; createdAt: string; variantId?: string | null; }
interface ProductVariant { id: string; name: string; price: number; description?: string | null; }
interface UploadRecord { filename: string; lineCount: number; successCount: number; failCount: number; timestamp: string; }

interface StockManagerProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
}

export default function StockManager({ open, onClose, productId, productTitle }: StockManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [allItems, setAllItems] = useState<StockItem[]>([]);
  const [soldItems, setSoldItems] = useState<StockItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rightTab, setRightTab] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);
  const [currentDuplicates, setCurrentDuplicates] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setFetching(true);
    try {
      const [varRes, availRes, soldRes] = await Promise.all([
        fetch(`/api/products/${productId}/variants`),
        fetch(`/api/products/${productId}/stock?isSold=false`),
        fetch(`/api/products/${productId}/stock?isSold=true`),
      ]);
      const varData = await varRes.json();
      const availData = await availRes.json();
      const soldData = await soldRes.json();
      setVariants(varData.variants || []);
      setAllItems(availData.items || []);
      setSoldItems(soldData.items || []);
      // Auto-select first variant
      if ((varData.variants || []).length > 0 && !selectedVariantId) {
        setSelectedVariantId(varData.variants[0].id);
      }
    } catch {
      setError('Lỗi tải dữ liệu');
    } finally {
      setFetching(false);
    }
  }, [productId, selectedVariantId]);

  useEffect(() => {
    if (open && productId) {
      loadData();
      setError('');
      setSuccess('');
      setRightTab(0);
    }
  }, [open, productId, loadData]);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setError('Chỉ chấp nhận file .txt');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File quá lớn (tối đa 10MB)');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setCurrentDuplicates(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setError('File trống, không có dữ liệu hợp lệ');
        setUploading(false);
        return;
      }

      // Check duplicates first
      let duplicateCount = 0;
      try {
        const dupRes = await fetch('/api/inventory/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: lines }),
        });
        const dupData = await dupRes.json();
        if (dupData.success && dupData.duplicates?.length > 0) {
          duplicateCount = dupData.duplicates.length;
        }
      } catch { /* ignore duplicate check errors */ }

      // Filter out duplicates by checking against existing items
      const validLines = duplicateCount > 0 
        ? lines.filter(l => !allItems.some(item => item.content === l))
        : lines;

      if (validLines.length === 0) {
        setError(`Tất cả ${lines.length} dòng đã tồn tại trong kho`);
        setUploading(false);
        return;
      }

      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentLines: validLines,
          variantId: selectedVariantId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const record: UploadRecord = {
          filename: file.name,
          lineCount: lines.length,
          successCount: validLines.length,
          failCount: duplicateCount,
          timestamp: new Date().toLocaleString('vi-VN'),
        };
        setUploadHistory(prev => [record, ...prev]);
        setSuccess(`Thêm thành công ${validLines.length} tài khoản.`);
        setCurrentDuplicates(duplicateCount);
        await loadData();
      } else {
        setError(data.error || 'Lỗi khi nạp kho');
      }
    } catch {
      setError('Lỗi đọc file hoặc kết nối server');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/stock?itemId=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllItems(prev => prev.filter(i => i.id !== itemId));
      }
    } catch { /* ignore */ }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa TẤT CẢ hàng chưa bán?')) return;
    try {
      const unsold = getFilteredItems();
      for (const item of unsold) {
        await fetch(`/api/products/${productId}/stock?itemId=${item.id}`, { method: 'DELETE' });
      }
      await loadData();
    } catch { setError('Lỗi xóa'); }
  };

  const handleDownloadUnsold = () => {
    const items = getFilteredItems();
    if (items.length === 0) return;
    const content = items.map(i => i.content).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kho-${productTitle.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maskContent = (content: string) => {
    const parts = content.split('|');
    if (parts.length > 1) return `${parts[0]}|${'*'.repeat(Math.min(parts[1]?.length || 4, 8))}${parts.length > 2 ? '|...' : ''}`;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const getFilteredItems = () => {
    if (!selectedVariantId) return allItems;
    return allItems.filter(i => i.variantId === selectedVariantId);
  };

  const getFilteredSoldItems = () => {
    if (!selectedVariantId) return soldItems;
    return soldItems.filter(i => i.variantId === selectedVariantId);
  };

  const currentVariant = variants.find(v => v.id === selectedVariantId);
  const filteredAvail = getFilteredItems();
  const filteredSold = getFilteredSoldItems();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 400, opacity: 0.8, fontSize: '0.75rem' }}>
              Tải dữ liệu lên cho sản phẩm
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {currentVariant ? `${currentVariant.name}` : productTitle}
              {currentVariant && <Typography component="span" sx={{ fontWeight: 400, opacity: 0.7, ml: 1, fontSize: '0.85rem' }}>· {productTitle}</Typography>}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600, borderRadius: 2, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            ← Quay lại
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {fetching ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', minHeight: 500 }}>
            {/* ─── LEFT: Upload Area ─── */}
            <Box sx={{ flex: '0 0 58%', p: 3, borderRight: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Tải file dữ liệu (.txt)</Typography>

              {/* Variant selector */}
              {variants.length > 1 && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <Select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    {variants.map(v => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.name} — {v.price.toLocaleString('vi-VN')}đ
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Success/Error alerts */}
              {success && (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: currentDuplicates > 0 ? 1 : 2, borderRadius: 2, fontWeight: 600 }} onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}
              {currentDuplicates > 0 && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }} onClose={() => setCurrentDuplicates(0)}>
                  Bỏ qua {currentDuplicates} tài khoản bị trùng lặp.
                </Alert>
              )}
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

              {/* Dropzone */}
              <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', mb: 0.5, display: 'block' }}>CHỌN TỆP</Typography>
              <Paper
                variant="outlined"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 4, mb: 3, textAlign: 'center', cursor: 'pointer',
                  borderStyle: 'dashed', borderWidth: 2, borderRadius: 2,
                  borderColor: dragOver ? '#16a34a' : '#d1d5db',
                  bgcolor: dragOver ? '#f0fdf4' : '#fafafa',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' },
                }}
              >
                {uploading ? (
                  <CircularProgress size={36} sx={{ color: '#16a34a' }} />
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                      Nhấn để chọn file hoặc kéo thả
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Dung lượng tối đa 10MB, định dạng .txt
                    </Typography>
                  </>
                )}
                <input ref={fileInputRef} type="file" hidden accept=".txt" onChange={handleFileSelect} />
              </Paper>

              {/* Format guide */}
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#92400e', display: 'block', mb: 0.5 }}>
                  QUY ĐỊNH ĐỊNH DẠNG:
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350f', mb: 1.5, fontSize: '0.82rem' }}>
                  Mỗi dòng trong file phải theo định dạng sau:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#1e293b', borderRadius: 2 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 2 }}>
                    username|password<br />
                    email|password|recovery<br />
                    <span style={{ color: '#94a3b8' }}>hoặc</span><br />
                    username:password<br />
                    <span style={{ color: '#94a3b8' }}>...</span>
                  </Typography>
                </Paper>
                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  ⚠️ Hệ thống sẽ tự động lọc trùng theo phần tên đầu trước dấu | hoặc :
                </Typography>
              </Paper>

              {/* Upload button */}
              <Button
                fullWidth variant="contained" size="large"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  mt: 3, py: 1.5, fontWeight: 800, borderRadius: 2, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' },
                }}
              >
                {uploading ? 'Đang tải lên...' : '☁️ Bắt đầu tải lên'}
              </Button>
            </Box>

            {/* ─── RIGHT: Stock Info ─── */}
            <Box sx={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column' }}>
              {/* Stock count card */}
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5 }}>Trong Kho Hiện Có</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                      {filteredAvail.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>Tài khoản</Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, background: 'linear-gradient(135deg, #e879f9 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InventoryIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                </Box>
              </Box>

              {/* Stock data section */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Dữ liệu trong kho</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownloadUnsold}
                      sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a' }}>
                      Tải xuống chưa bán
                    </Button>
                    <Button size="small" startIcon={<DeleteSweepIcon />} onClick={handleDeleteAll}
                      sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626' }}>
                      Xóa tất cả
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ px: 3 }}>
                  <Tabs value={rightTab} onChange={(_, v) => setRightTab(v)} sx={{ minHeight: 36 }}>
                    <Tab label={<Chip label="Sẵn có" size="small" color={rightTab === 0 ? 'success' : 'default'} sx={{ fontWeight: 700, cursor: 'pointer' }} />} sx={{ minHeight: 36, p: 0.5 }} />
                    <Tab label={<Chip label="Đã bán" size="small" color={rightTab === 1 ? 'warning' : 'default'} sx={{ fontWeight: 700, cursor: 'pointer' }} />} sx={{ minHeight: 36, p: 0.5 }} />
                    <Tab label={<Chip label="Lịch sử tải lên" size="small" color={rightTab === 2 ? 'primary' : 'default'} sx={{ fontWeight: 700, cursor: 'pointer' }} />} sx={{ minHeight: 36, p: 0.5 }} />
                  </Tabs>
                  <Divider />
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 1.5, maxHeight: 320 }}>
                  {/* Sẵn có tab */}
                  {rightTab === 0 && (
                    filteredAvail.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Kho hiện tại đang trống.</Typography>
                      </Box>
                    ) : (
                      filteredAvail.map((item) => (
                        <Box key={item.id} sx={{
                          display: 'flex', alignItems: 'center', gap: 1, py: 1.2,
                          borderBottom: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' },
                        }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all' }}>
                            {maskContent(item.content)}
                          </Typography>
                          <Chip label="SẴN CÓ" size="small" sx={{ fontWeight: 800, fontSize: '0.6rem', bgcolor: '#dcfce7', color: '#166534', height: 22 }} />
                          <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))
                    )
                  )}

                  {/* Đã bán tab */}
                  {rightTab === 1 && (
                    filteredSold.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Chưa có đơn hàng nào.</Typography>
                      </Box>
                    ) : (
                      filteredSold.map((item) => (
                        <Box key={item.id} sx={{
                          display: 'flex', alignItems: 'center', gap: 1, py: 1.2,
                          borderBottom: '1px solid #f1f5f9', opacity: 0.7,
                        }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all' }}>
                            {maskContent(item.content)}
                          </Typography>
                          <Chip label="ĐÃ BÁN" size="small" sx={{ fontWeight: 800, fontSize: '0.6rem', bgcolor: '#fef3c7', color: '#92400e', height: 22 }} />
                        </Box>
                      ))
                    )
                  )}

                  {/* Lịch sử tải lên tab */}
                  {rightTab === 2 && (
                    uploadHistory.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Chưa có lịch sử tải lên.</Typography>
                      </Box>
                    ) : (
                      uploadHistory.map((record, idx) => (
                        <Box key={idx} sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <DescriptionIcon sx={{ fontSize: 18, color: '#64748b' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{record.filename}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Số dòng: {record.lineCount} | Thành công: {record.successCount} | Trùng: {record.failCount}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                            Thêm lúc: {record.timestamp}
                          </Typography>
                        </Box>
                      ))
                    )
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
