'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Typography, Box,
  CircularProgress, Alert, Switch, Divider, IconButton,
  Chip, Stepper, Step, StepLabel, Paper, InputAdornment
} from '@mui/material';
import Image from 'next/image';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TuneIcon from '@mui/icons-material/Tune';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

interface Category { id: string; name: string; parentId?: string | null; }
interface Variant { id: string; name: string; price: string; description: string; allowBidding: boolean; deliveryTimeHours: string; }

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

const STEPS = ['Thông tin cơ bản', 'Sản phẩm & Giá', 'Xác nhận'];

export default function ProductForm({ open, onClose, onSuccess, product, sellerId }: ProductFormProps) {
  const isEdit = !!product;
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    type: 'DIGITAL',
    warranty: '3',
    thumbnail: '',
    isService: false,
    autoDelivery: true,
  });

  const [uploading, setUploading] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([
    { id: '1', name: '', price: '', description: '', allowBidding: false, deliveryTimeHours: '' },
  ]);



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

      if (product) {
        setFormData({
          title: (product.title as string) || '',
          shortDescription: (product.shortDescription as string) || '',
          description: (product.description as string) || '',
          categoryId: (product.categoryId as string) || '',
          type: (product.type as string) || 'DIGITAL',
          warranty: String((product.warrantyDays as number) || 3),
          thumbnail: (product.thumbnail as string) || '',
          isService: !!product.isService,
          autoDelivery: !!product.autoDelivery,
        });
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          setVariants((product.variants as any[]).map((v) => ({
            id: v.id,
            name: v.name,
            price: String(v.price),
            description: v.description || '',
            allowBidding: !!v.allowBidding,
            deliveryTimeHours: v.deliveryTimeHours ? String(v.deliveryTimeHours) : '',
          })));
        } else {
          setVariants([{ id: '1', name: '', price: '', description: '', allowBidding: false, deliveryTimeHours: '' }]);
        }
      } else {
        setFormData({ 
          title: '', shortDescription: '', description: '', categoryId: '', type: 'DIGITAL', warranty: '3', thumbnail: '',
          isService: false, autoDelivery: true
        });
        setVariants([{ id: '1', name: '', price: '', description: '', allowBidding: false, deliveryTimeHours: '' }]);
      }
    }
  }, [product, open, fetchCategories]);

  const addVariant = () => {
    setVariants(prev => [...prev, { id: Date.now().toString(), name: '', price: '', description: '', allowBidding: false, deliveryTimeHours: '' }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length === 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };



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
    if (activeStep === 0) {
      if (!formData.title.trim() || !formData.categoryId) return false;
      // if (formData.isService) { // This check is no longer needed here as deliveryTimeHours is removed
      //   if (!formData.deliveryTimeHours) return false;
      //   // if not bidding, variants must have price
      // }
      return true;
    }
    if (activeStep === 1) {
      return variants.every(v => {
        if (!v.name.trim()) return false;
        if (formData.isService) {
          if (!v.allowBidding && !v.price) return false;
          // deliveryTimeHours is optional but recommended
        } else {
          if (!v.price) return false;
        }
        return true;
      });
    }
    return true;
  };

  const handleNext = () => {
    setActiveStep(s => s + 1);
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

  const stepIcons = [StorefrontIcon, TuneIcon, CheckCircleIcon];

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
                {isEdit ? 'Chỉnh sửa gian hàng' : 'Tạo gian hàng mới'}
              </Typography>
              {!isEdit && (
                <Typography variant="caption" color="text.secondary">Bước {activeStep + 1}/{STEPS.length}: {STEPS[activeStep]}</Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      {!isEdit && (
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
                        bgcolor: i <= activeStep ? '#16a34a' : '#e2e8f0',
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
      )}

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
                  cursor: 'pointer', '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' },
                }}
                onClick={() => document.getElementById('product-image-upload')?.click()}
              >
                {formData.thumbnail ? (
                  <Image src={formData.thumbnail} alt="Preview" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
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
                fullWidth label="Tên gian hàng *"
                placeholder="VD: Tài khoản Netflix Premium 4K Shared"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Box>
            <TextField 
              fullWidth label="Mô tả ngắn (Hiển thị ở trang chủ) *"
              placeholder="VD: Tài khoản Netflix xem ổn định, bảo hành 1 đổi 1..."
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select fullWidth label="Loại gian hàng *"
                value={formData.type}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    type: val, 
                    isService: val === 'SERVICE',
                    // reset service fields if switching back
                    // allowBidding: val === 'SERVICE' ? formData.allowBidding : false, // allowBidding is now variant-level
                    // deliveryTimeHours: val === 'SERVICE' ? formData.deliveryTimeHours : '' // Removed
                  });
                }}
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
                  // Hierarchical grouping
                  categories
                    .filter(cat => !cat.parentId) // Main parents
                    .map(parent => [
                      <MenuItem key={parent.id} disabled sx={{ fontWeight: 800, color: 'text.primary', opacity: '1 !important', bgcolor: '#f8fafc' }}>
                        {parent.name}
                      </MenuItem>,
                      ...categories
                        .filter(child => child.parentId === parent.id)
                        .map(child => (
                          <MenuItem key={child.id} value={child.id} sx={{ pl: 4 }}>
                            {child.name}
                          </MenuItem>
                        ))
                    ])
                    .flat()
                )}
                {/* Fallback for categories without parents if any */}
                {categories.filter(c => !c.parentId && !categories.some(child => child.parentId === c.id)).map(c => (
                   <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Service Toggle */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Gian hàng dịch vụ</Typography>
                  <Typography variant="caption" color="text.secondary">Nếu bật, sản phẩm này sẽ được phân loại là dịch vụ.</Typography>
                </Box>
                <Switch 
                  checked={formData.isService}
                  onChange={(e) => setFormData({ ...formData, isService: e.target.checked })}
                  color="primary"
                />
              </Box>
            </Box>

            {formData.isService && (
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a' }}>Cấu hình Dịch Vụ</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <input
                    type="checkbox"
                    id="auto-delivery"
                    checked={formData.autoDelivery}
                    onChange={(e) => setFormData({ ...formData, autoDelivery: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#3b82f6', marginRight: 12 }}
                  />
                  <label htmlFor="auto-delivery" style={{ cursor: 'pointer', flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Giao hàng tự động</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Nếu bật, hệ thống sẽ tự động giao hàng sau khi thanh toán thành công.
                    </Typography>
                  </label>
                </Box>
              </Box>
            )}

            <TextField
              select fullWidth label="Bảo hành"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              {[1,3,7,14,30].map(d => <MenuItem key={d} value={String(d)}>{d} ngày</MenuItem>)}
            </TextField>
            <TextField
              fullWidth multiline rows={4} label="Mô tả gian hàng"
              placeholder="Cung cấp thông tin chi tiết, hướng dẫn sử dụng, chế độ bảo hành..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Box>
        )}

        {/* ─── Step 1: Sản phẩm & Giá ─── */}
        {activeStep === 1 && (
          <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <Typography variant="body2" sx={{ color: '#15803d', fontSize: '0.85rem' }}>
                {formData.isService ? (
                  <>💡 <strong>Các gói dịch vụ</strong> cho phép bạn tạo nhiều mức giá sẵn. 
                  {/* {formData.allowBidding && " Vì bạn đã bật cho phép thương lượng, bạn có thể để trống giá nếu muốn báo giá tùy chỉnh 100%."} */}
                  </>
                ) : (
                  <>💡 <strong>Sản phẩm</strong> cho phép bạn bán nhiều loại trong 1 gian hàng. Ví dụ: Gmail cổ 2009-2015 (49k), Gmail trung 2016-2020 (29k), Gmail mới (9k). Mỗi sản phẩm có kho riêng.</>
                )}
              </Typography>
            </Paper>
            {variants.map((variant, idx) => (
              <Paper key={variant.id} variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip label={`Sản phẩm ${idx + 1}`} size="small" sx={{ fontWeight: 700, mr: 1, bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Cấu hình sản phẩm</Typography>
                  {variants.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => removeVariant(variant.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, mb: 1.5 }}>
                  <TextField
                    fullWidth size="small" label="Tên sản phẩm *"
                    placeholder="VD: Gmail 2009-2015 (Cổ)"
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                  <TextField
                    size="small" label={`Giá (VNĐ) ${variant.allowBidding ? '' : '*'}`} type="number"
                    placeholder={variant.allowBidding ? "Thỏa thuận" : "49000"}
                    value={variant.allowBidding && !variant.price ? '' : variant.price}
                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                    sx={{ width: 140 }}
                    InputProps={{ sx: { borderRadius: 2 } }}
                    disabled={variant.allowBidding && variants.length === 1 && !variant.name && !variant.price} 
                  />
                </Box>

                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: variant.allowBidding && formData.isService ? 1.5 : 0 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Thỏa thuận giá</Typography>
                      <Typography variant="caption" color="text.secondary">Khách sẽ không thanh toán ngay mà tạo đơn thương lượng.</Typography>
                    </Box>
                    <Switch 
                      size="small"
                      checked={variant.allowBidding}
                      onChange={(e) => updateVariant(variant.id, 'allowBidding', e.target.checked)}
                    />
                  </Box>
                  {variant.allowBidding && formData.isService && (
                    <Box sx={{ pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
                       <TextField
                        fullWidth size="small" label="Thời gian thực hiện mặc định (giờ)"
                        type="number"
                        value={variant.deliveryTimeHours}
                        onChange={(e) => updateVariant(variant.id, 'deliveryTimeHours', e.target.value)}
                        placeholder="VD: 24"
                        InputProps={{ 
                          sx: { borderRadius: 2 },
                          endAdornment: <InputAdornment position="end">giờ</InputAdornment>
                        }}
                        helperText="Dùng làm mốc thời gian cơ sở khi thương lượng"
                      />
                    </Box>
                  )}
                </Box>

                <TextField
                  fullWidth size="small" label="Mô tả sản phẩm (Không bắt buộc)"
                  placeholder="Thông tin thêm về sản phẩm này..."
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
              Thêm sản phẩm mới
            </Button>
          </Box>
        )}


        {/* ─── Step 2: Xác nhận ─── */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#64748b' }}>THÔNG TIN GIAN HÀNG</Typography>
              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                {formData.thumbnail && (
                  <Box sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', flexShrink: 0, position: 'relative' }}>
                    <Image src={formData.thumbnail} alt="Product" fill style={{ objectFit: 'cover' }} unoptimized />
                  </Box>
                )}
                <Box sx={{ display: 'grid', gap: 1, flex: 1 }}>
                  {[
                    { k: 'Tên gian hàng', v: formData.title },
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#64748b' }}>{variants.length} SẢN PHẨM</Typography>
              {variants.map((v, i) => (
                <Box key={v.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: i < variants.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Sản phẩm {i + 1}: {v.name}</Typography>
                      {v.allowBidding && (
                        <Chip label="Thương lượng" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                      {v.description && <Typography variant="caption" color="text.secondary">{v.description}</Typography>}
                      {v.deliveryTimeHours && (
                        <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600 }}>⏱ {v.deliveryTimeHours}h</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                      {v.allowBidding && !v.price ? 'Thỏa thuận' : `${parseInt(v.price || '0').toLocaleString('vi-VN')}đ`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Nhập kho sau khi tạo</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
              <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600 }}>💡 Sau khi tạo gian hàng, bạn có thể nhập kho bằng file .txt trong phần quản lý kho.</Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        {!isEdit && activeStep > 0 && (
          <Button onClick={() => setActiveStep(s => s - 1)} color="inherit" sx={{ fontWeight: 700 }}>← Quay lại</Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }}>Hủy</Button>
        
        {isEdit ? (
          <Button
            variant="contained" disableElevation onClick={handleSubmit}
            disabled={loading || !canProceed()}
            sx={{ 
              fontWeight: 800, px: 4, borderRadius: 2, 
              bgcolor: '#16a34a !important', color: 'white !important',
              '&:hover': { bgcolor: '#15803d !important' } 
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : '💾 Lưu thay đổi'}
          </Button>
        ) : (
          activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained" disableElevation
              onClick={handleNext}
              disabled={!canProceed() || loading}
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
          )
        )}
      </DialogActions>
    </Dialog>
  );
}
