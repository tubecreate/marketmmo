'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Typography, Box,
  CircularProgress, Alert, Divider, IconButton,
  Chip, Stepper, Step, StepLabel, Paper,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TuneIcon from '@mui/icons-material/Tune';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

interface Category { id: string; name: string; }
interface Variant { id: string; name: string; price: string; description: string; }

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Record<string, unknown>;
  sellerId: string;
}

const PRODUCT_TYPES = [
  { value: 'DIGITAL', label: '🔑 Sản phẩm số (Acc, Key, Gift card...)' },
  { value: 'SERVICE', label: '⚙️ Dịch vụ (Tăng follow, like...)' },
];

const STEPS = ['Thông tin cơ bản', 'Biến thể & Giá', 'Nhập kho', 'Xác nhận'];

export default function ProductForm({ open, onClose, onSuccess, product, sellerId }: ProductFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    type: 'DIGITAL',
    warranty: '3',
    thumbnail: '',
  });

  const [uploading, setUploading] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([
    { id: '1', name: '', price: '', description: '' },
  ]);

  // Stock per variant: { [variantId]: string (textarea content) }
  const [stockMap, setStockMap] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCategories();
      setActiveStep(0);
      setError('');
      setStockMap({});
      if (product) {
        setFormData({
          title: (product.title as string) || '',
          description: (product.description as string) || '',
          categoryId: (product.categoryId as string) || '',
          type: (product.type as string) || 'DIGITAL',
          warranty: String((product.warrantyDays as number) || 3),
          thumbnail: (product.thumbnail as string) || '',
        });
      } else {
        setFormData({ title: '', description: '', categoryId: '', type: 'DIGITAL', warranty: '3', thumbnail: '' });
        setVariants([{ id: '1', name: '', price: '', description: '' }]);
      }
    }
  }, [product, open, fetchCategories]);

  const addVariant = () => {
    setVariants(prev => [...prev, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length === 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
    setStockMap(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const getLineCount = (id: string) => (stockMap[id] || '').split('\n').filter(l => l.trim()).length;
  const totalStockCount = variants.reduce((sum, v) => sum + getLineCount(v.id), 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, thumbnail: data.url }));
      } else {
        setError(data.error || 'Lỗi tải ảnh');
      }
    } catch {
      setError('Lỗi kết nối khi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) return formData.title.trim() && formData.categoryId;
    if (activeStep === 1) return variants.every(v => v.name.trim() && v.price);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const url = product ? `/api/products/${product.id}` : '/api/products/create';
    const method = product ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variants,
          stockMap, // pass stock data for each variant
          sellerId,
          price: parseFloat(variants[0]?.price || '0'),
          warrantyDays: parseInt(formData.warranty),
        }),
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
      else setError(data.error || 'Có lỗi xảy ra');
    } catch { setError('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  const stepIcons = [StorefrontIcon, TuneIcon, InventoryIcon, CheckCircleIcon];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 1.5, color: '#16a34a', display: 'flex' }}>
              <StorefrontIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {product ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm mới'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Bước {activeStep + 1}/{STEPS.length}: {STEPS[activeStep]}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1.5 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label, i) => {
            const Icon = stepIcons[i];
            return (
              <Step key={label} completed={i < activeStep}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: i < activeStep ? '#16a34a' : i === activeStep ? '#1d4ed8' : '#e2e8f0',
                      color: i <= activeStep ? 'white' : '#94a3b8',
                      flexShrink: 0,
                    }}>
                      <Icon sx={{ fontSize: 14 }} />
                    </Box>
                  )}
                >
                  <Typography variant="caption" sx={{ fontWeight: activeStep === i ? 700 : 400, fontSize: '0.7rem' }}>{label}</Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Box>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* ─── Step 0: Thông tin cơ bản ─── */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
              <Box
                sx={{
                  width: 100, height: 100, borderRadius: 2, border: '2px dashed #e2e8f0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative', bgcolor: '#f8fafc', flexShrink: 0,
                  cursor: 'pointer', '&:hover': { borderColor: '#1d4ed8', bgcolor: '#f1f5f9' },
                }}
                onClick={() => document.getElementById('product-image-upload')?.click()}
              >
                {formData.thumbnail ? (
                  <img src={formData.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    {uploading ? <CircularProgress size={20} /> : <AddPhotoAlternateIcon sx={{ color: '#94a3b8', mb: 0.5 }} />}
                    <Typography variant="caption" color="text.secondary">Ảnh đại diện</Typography>
                  </>
                )}
                <input
                  type="file" id="product-image-upload" hidden accept="image/*"
                  onChange={handleFileUpload}
                />
              </Box>
              <TextField
                fullWidth label="Tên sản phẩm *"
                placeholder="VD: Tài khoản Netflix Premium 4K Shared"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select fullWidth label="Loại sản phẩm *"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                {PRODUCT_TYPES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select fullWidth label="Danh mục *"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                {categories.length === 0 ? (
                  <MenuItem value="">-- Chọn danh mục --</MenuItem>
                ) : (
                  categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)
                )}
              </TextField>
            </Box>
            <TextField
              select fullWidth label="Bảo hành"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              {[1,3,7,14,30].map(d => <MenuItem key={d} value={String(d)}>{d} ngày</MenuItem>)}
            </TextField>
            <TextField
              fullWidth multiline rows={4} label="Mô tả sản phẩm"
              placeholder="Cung cấp thông tin chi tiết, hướng dẫn sử dụng, chế độ bảo hành..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Box>
        )}

        {/* ─── Step 1: Biến thể & Giá ─── */}
        {activeStep === 1 && (
          <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <Typography variant="body2" sx={{ color: '#15803d', fontSize: '0.85rem' }}>
                💡 <strong>Biến thể</strong> cho phép bạn bán nhiều loại trong 1 sản phẩm. Ví dụ: Gmail cổ 2009-2015 (49k), Gmail trung 2016-2020 (29k), Gmail mới (9k). Mỗi biến thể có kho riêng.
              </Typography>
            </Paper>
            {variants.map((variant, idx) => (
              <Paper key={variant.id} variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip label={`Gói ${idx + 1}`} size="small" color="primary" sx={{ fontWeight: 700, mr: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Cấu hình biến thể</Typography>
                  {variants.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => removeVariant(variant.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, mb: 1.5 }}>
                  <TextField
                    fullWidth size="small" label="Tên gói *"
                    placeholder="VD: Gmail 2009-2015 (Cổ)"
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small" label="Giá (VNĐ) *" type="number"
                    placeholder="49000"
                    value={variant.price}
                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                    sx={{ width: 140 }}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Box>
                <TextField
                  fullWidth size="small" label="Mô tả gói (Không bắt buộc)"
                  placeholder="Thông tin thêm về gói này..."
                  value={variant.description}
                  onChange={(e) => updateVariant(variant.id, 'description', e.target.value)}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Paper>
            ))}
            <Button
              startIcon={<AddCircleOutlineIcon />} variant="outlined"
              onClick={addVariant} fullWidth
              sx={{ borderRadius: 2, borderStyle: 'dashed', py: 1.5, fontWeight: 700, color: '#16a34a', borderColor: '#16a34a' }}
            >
              Thêm biến thể mới
            </Button>
          </Box>
        )}

        {/* ─── Step 2: Nhập kho ─── */}
        {activeStep === 2 && (
          <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#fffbeb', borderColor: '#fde68a' }}>
              <Typography variant="body2" sx={{ color: '#92400e', fontSize: '0.85rem' }}>
                📋 Nhập kho ban đầu cho từng gói. <strong>Định dạng: mỗi dòng là 1 tài khoản</strong>.
                Ví dụ: <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>email|password|2fa_key</code>.
                Bạn có thể để trống và nạp kho sau.
              </Typography>
            </Paper>
            {variants.map((variant, idx) => {
              const count = getLineCount(variant.id);
              return (
                <Accordion key={variant.id} defaultExpanded={idx === 0} sx={{ mb: 1, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                      <Chip label={`Gói ${idx + 1}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                        {variant.name || `Biến thể ${idx + 1}`}
                        {variant.price && <span style={{ color: '#dc2626', marginLeft: 8 }}>{parseInt(variant.price).toLocaleString('vi-VN')}đ</span>}
                      </Typography>
                      {count > 0 ? (
                        <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label={`${count} items`} size="small" color="success" />
                      ) : (
                        <Chip label="Chưa nhập" size="small" variant="outlined" sx={{ color: '#94a3b8' }} />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth multiline rows={5}
                      placeholder={`Dán ${variant.name || 'tài khoản'} vào đây...\nuser1@gmail.com|Pass@123|TOTP_KEY\nuser2@gmail.com|Pass@456|TOTP_KEY`}
                      value={stockMap[variant.id] || ''}
                      onChange={(e) => setStockMap(prev => ({ ...prev, [variant.id]: e.target.value }))}
                      InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem', borderRadius: 2 } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {count > 0 ? `✅ ${count} dòng hợp lệ sẽ được nhập vào kho gói "${variant.name}"` : 'Mỗi dòng = 1 tài khoản. Dòng trống sẽ bị bỏ qua.'}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
            {totalStockCount > 0 && (
              <Paper sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 700 }}>
                  ✅ Tổng cộng: {totalStockCount} tài khoản sẽ được nhập vào kho ngay sau khi đăng.
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* ─── Step 3: Xác nhận ─── */}
        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#64748b' }}>THÔNG TIN SẢN PHẨM</Typography>
              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                {formData.thumbnail && (
                  <Box sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                    <img src={formData.thumbnail} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
                <Box sx={{ display: 'grid', gap: 1, flex: 1 }}>
                  {[
                    { k: 'Tên sản phẩm', v: formData.title },
                    { k: 'Loại', v: formData.type },
                    { k: 'Bảo hành', v: `${formData.warranty} ngày` },
                  ].map(row => (
                    <Box key={row.k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{row.k}:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.v}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#64748b' }}>{variants.length} BIẾN THỂ</Typography>
              {variants.map((v, i) => (
                <Box key={v.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: i < variants.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Gói {i + 1}: {v.name}</Typography>
                    {v.description && <Typography variant="caption" color="text.secondary">{v.description}</Typography>}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>{parseInt(v.price).toLocaleString('vi-VN')}đ</Typography>
                    <Typography variant="caption" color="text.secondary">{getLineCount(v.id) > 0 ? `${getLineCount(v.id)} acc sẵn sàng` : 'Chưa có kho'}</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
            {totalStockCount > 0 && (
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 700 }}>📦 Tổng kho ban đầu: {totalStockCount} tài khoản</Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(s => s - 1)} color="inherit" sx={{ fontWeight: 700 }}>← Quay lại</Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }}>Hủy</Button>
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained" disableElevation
            onClick={() => setActiveStep(s => s + 1)}
            disabled={!canProceed()}
            sx={{ 
              fontWeight: 800, borderRadius: 2, px: 3,
              bgcolor: '#16a34a !important', color: 'white !important',
              '&:hover': { bgcolor: '#15803d !important' }
            }}
          >
            Tiếp theo →
          </Button>
        ) : (
          <Button
            variant="contained" disableElevation onClick={handleSubmit}
            disabled={loading}
            sx={{ 
              fontWeight: 800, px: 4, borderRadius: 2, 
              bgcolor: '#16a34a !important', color: 'white !important',
              '&:hover': { bgcolor: '#15803d !important' } 
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : '🚀 Đăng ngay'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
