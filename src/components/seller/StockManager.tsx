'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
  IconButton, Divider, Alert, Paper, Chip, Tab, Tabs,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface StockItem { id: string; content: string; createdAt: string; variantId?: string | null; }
interface ProductVariant { id: string; name: string; price: number; description?: string | null; }

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
  const [uploadMap, setUploadMap] = useState<Record<string, string>>({}); // variantId/'' -> text
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

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
    } catch {
      setError('Lỗi tải dữ liệu');
    } finally {
      setFetching(false);
    }
  }, [productId]);

  useEffect(() => {
    if (open && productId) {
      loadData();
      setUploadMap({});
      setError('');
      setTab(0);
    }
  }, [open, productId, loadData]);

  const handleUpload = async (variantId: string | null) => {
    const key = variantId || '__no_variant__';
    const raw = uploadMap[key] || '';
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setUploading(prev => ({ ...prev, [key]: true }));
    setError('');
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentLines: lines, variantId }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadMap(prev => ({ ...prev, [key]: '' }));
        await loadData();
      } else {
        setError(data.error || 'Lỗi khi nạp kho');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/stock?itemId=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllItems(prev => prev.filter(i => i.id !== itemId));
      }
    } catch { /* ignore */ }
  };

  const maskContent = (content: string) => {
    const parts = content.split('|');
    if (parts.length > 1) return `${parts[0]}|${'*'.repeat(Math.min(parts[1]?.length || 4, 8))}${parts.length > 2 ? '|...' : ''}`;
    return content.length > 36 ? content.substring(0, 36) + '...' : content;
  };

  const getVariantItems = (vid: string | null) =>
    allItems.filter(i => (vid ? i.variantId === vid : !i.variantId));

  const totalAvail = allItems.length;
  const totalSold = soldItems.length;

  // Which groups to show in "Nạp kho" tab
  const uploadGroups = variants.length > 0
    ? variants.map(v => ({ id: v.id, name: v.name, price: v.price }))
    : [{ id: null as null, name: 'Kho chung', price: 0 }];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 1.5, color: '#16a34a', display: 'flex' }}>
              <InventoryIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>Quản lý kho hàng</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 320, display: 'block' }}>{productTitle}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${totalAvail} còn`} size="small" color="success" />
            <Chip label={`${totalSold} đã bán`} size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="📥 Nạp kho" />
          <Tab label={`📦 Trong kho (${totalAvail})`} />
          <Tab label={`✅ Đã bán (${totalSold})`} />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {fetching ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              {/* ── Nạp kho mới ── */}
              {tab === 0 && (
                <Box>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#fffbeb', borderColor: '#fde68a' }}>
                    <Typography variant="body2" sx={{ color: '#92400e', fontSize: '0.83rem' }}>
                      📋 Nạp tài khoản cho từng gói. Mỗi dòng = 1 tài khoản.{' '}
                      Định dạng gợi ý:{' '}
                      <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>email|password|2fa</code>
                    </Typography>
                  </Paper>

                  {uploadGroups.map((group, idx) => {
                    const key = group.id || '__no_variant__';
                    const lines = (uploadMap[key] || '').split('\n').filter(l => l.trim()).length;
                    const isLoading = uploading[key];
                    return (
                      <Accordion key={key} defaultExpanded={idx === 0}
                        sx={{ mb: 1.5, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                            <Chip label={`Gói ${idx + 1}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
                              {group.name}
                              {group.price > 0 && (
                                <span style={{ color: '#dc2626', marginLeft: 8 }}>{group.price.toLocaleString('vi-VN')}đ</span>
                              )}
                            </Typography>
                            <Chip
                              label={`${getVariantItems(group.id).length} acc`}
                              size="small"
                              color={getVariantItems(group.id).length > 0 ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TextField
                            fullWidth multiline rows={5}
                            placeholder={`Dán ${group.name} vào đây...\nuser1@gmail.com|Pass@123|TOTP_KEY\nuser2@gmail.com|Pass@456|TOTP_KEY`}
                            value={uploadMap[key] || ''}
                            onChange={e => setUploadMap(prev => ({ ...prev, [key]: e.target.value }))}
                            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem', borderRadius: 2 } }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {lines > 0 ? `${lines} dòng hợp lệ` : 'Dòng trống bỏ qua'}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <CloudUploadIcon />}
                              onClick={() => handleUpload(group.id)}
                              disabled={isLoading || lines === 0}
                              sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                            >
                              Nạp {lines} tài khoản
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}

                  {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
                </Box>
              )}

              {/* ── Trong kho ── */}
              {tab === 1 && (
                <Box>
                  {allItems.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📦</Typography>
                      <Typography color="text.secondary" fontWeight={600}>Kho đang trống</Typography>
                      <Typography variant="caption" color="text.secondary">Nạp kho ở tab &quot;📥 Nạp kho&quot;</Typography>
                    </Paper>
                  ) : variants.length === 0 ? (
                    allItems.map((item, idx) => (
                      <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, px: 2, borderBottom: idx < allItems.length - 1 ? '1px solid #f1f5f9' : 'none', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, fontSize: '0.82rem', color: '#475569' }}>{maskContent(item.content)}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Typography>
                        <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                      </Box>
                    ))
                  ) : (
                    variants.map((variant) => {
                      const items = allItems.filter(i => i.variantId === variant.id);
                      return (
                        <Box key={variant.id} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip label={variant.name} size="small" color="primary" />
                            <Chip label={`${items.length} acc`} size="small" color={items.length > 0 ? 'success' : 'default'} variant="outlined" />
                            <Typography variant="caption" color="text.secondary">{variant.price.toLocaleString('vi-VN')}đ/acc</Typography>
                          </Box>
                          {items.length === 0 ? (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, borderStyle: 'dashed', textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">Chưa có hàng trong gói này</Typography>
                            </Paper>
                          ) : items.map((item, idx) => (
                            <Box key={item.id} sx={{
                              display: 'flex', alignItems: 'center', gap: 2, py: 1.2, px: 2,
                              borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                              '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 1,
                            }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, fontSize: '0.82rem', color: '#475569' }}>
                                {maskContent(item.content)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                              </Typography>
                              <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      );
                    })
                  )}
                </Box>
              )}

              {/* ── Đã bán ── */}
              {tab === 2 && (
                <Box>
                  {soldItems.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📋</Typography>
                      <Typography color="text.secondary">Chưa có đơn hàng nào</Typography>
                    </Paper>
                  ) : soldItems.map((item, idx) => (
                    <Box key={item.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 2, py: 1.2, px: 2,
                      borderBottom: idx < soldItems.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: 0.65,
                    }}>
                      <Chip label="Đã bán" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, fontSize: '0.82rem', color: '#64748b' }}>
                        {maskContent(item.content)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ fontWeight: 700, borderRadius: 2 }}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
