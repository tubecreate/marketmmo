'use client';
import React from 'react';
import { 
  Box, Typography, Paper, 
  Slider, Radio, RadioGroup, FormControlLabel, Button,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCat: string;
  onCatChange: (slug: string) => void;
  priceRange: number[];
  onPriceChange: (val: number[]) => void;
  stockStatus: string;
  onStockChange: (val: string) => void;
}

export default function CategorySidebar({
  categories,
  selectedCat,
  onCatChange,
  priceRange,
  onPriceChange,
  stockStatus,
  onStockChange
}: CategorySidebarProps) {
  
  // Group categories by parent
  const parentCats = categories.filter(c => !c.parentId);
  
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Category Tree */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: '#16a34a', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Bộ lọc</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="body2" 
            onClick={() => onCatChange('all')}
            sx={{ 
              py: 1, px: 1, borderRadius: 1.5, cursor: 'pointer',
              fontWeight: selectedCat === 'all' ? 700 : 500,
              color: selectedCat === 'all' ? '#16a34a' : 'text.primary',
              bgcolor: selectedCat === 'all' ? '#f0fdf4' : 'transparent',
              '&:hover': { bgcolor: '#f8fafc' }
            }}
          >
            -- Tất cả danh mục
          </Typography>
          
          {parentCats.map(parent => (
            <Accordion 
              key={parent.id} 
              defaultExpanded 
              elevation={0} 
              sx={{ 
                '&:before': { display: 'none' },
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                sx={{ px: 1, minHeight: 40, '& .MuiAccordionSummary-content': { my: 1 } }}
              >
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{parent.name}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1, px: 2 }}>
                {categories.filter(c => c.parentId === parent.id).map(child => (
                   <Box 
                    key={child.id}
                    onClick={() => onCatChange(child.slug)}
                    sx={{ 
                      py: 0.8, px: 1, borderRadius: 1, cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      gap: 1.5,
                      '&:hover': { bgcolor: '#f8fafc' },
                      bgcolor: selectedCat === child.slug ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <Box sx={{ width: 14, height: 14, border: '1px solid', borderColor: selectedCat === child.slug ? '#16a34a' : '#cbd5e1', borderRadius: '3px', position: 'relative', bgcolor: selectedCat === child.slug ? '#16a34a' : 'white' }}>
                      {selectedCat === child.slug && <Box sx={{ position: 'absolute', top: 1, left: 4, width: 4, height: 8, border: 'solid white', borderWidth: '0 2px 2px 0', transform: 'rotate(45deg)' }} />}
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: selectedCat === child.slug ? 700 : 500, color: selectedCat === child.slug ? '#16a34a' : 'text.primary' }}>
                      {child.name}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        
        <Button 
          fullWidth 
          variant="contained" 
          size="small"
          sx={{ mt: 2, bgcolor: '#fbbf24', color: 'black', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#f59e0b' } }}
        >
          🔍 Tìm kiếm
        </Button>
      </Paper>

      {/* Price Range */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Khoảng giá</Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={priceRange}
            onChange={(_, val) => onPriceChange(val as number[])}
            valueLabelDisplay="auto"
            min={0}
            max={20000000}
            step={100000}
            sx={{ color: '#16a34a' }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">{priceRange[0].toLocaleString()} đ</Typography>
            <Typography variant="caption" color="text.secondary">{priceRange[1].toLocaleString()} đ</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stock Status */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Tình trạng kho</Typography>
        <RadioGroup value={stockStatus} onChange={(e) => onStockChange(e.target.value)}>
          <FormControlLabel 
            value="all" 
            control={<Radio size="small" sx={{ color: '#16a34a', '&.Mui-checked': { color: '#16a34a' } }} />} 
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Tất cả</Typography>} 
          />
          <FormControlLabel 
            value="inStock" 
            control={<Radio size="small" sx={{ color: '#16a34a', '&.Mui-checked': { color: '#16a34a' } }} />} 
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Chỉ hiện có hàng</Typography>} 
          />
        </RadioGroup>
      </Paper>

      {/* Extra Links (as seen in image) */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Bài viết tham khảo</Typography>
          <Typography sx={{ fontSize: '1rem' }}>🔔</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, cursor: 'pointer', '&:hover': { color: '#16a34a' } }}>
          chia sẻ nhiều kèo mmo ai cần ib
        </Typography>
      </Paper>
    </Box>
  );
}
