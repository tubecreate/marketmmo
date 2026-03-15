'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import { 
  Box, Container, Grid, Typography, 
  Breadcrumbs, Link as MuiLink, Skeleton, Tabs, Tab,
  Paper, TextField, Select, MenuItem, Button
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import ProductCard, { ProductCardProps } from '@/components/products/ProductCard';
import CategorySidebar from '@/components/products/CategorySidebar';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

function FilterPageContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Filter states
  const [q, setQ] = useState('');
  const [tempQ, setTempQ] = useState('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000000]);
  const [stockStatus, setStockStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/products?category=${slug}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}&sort=${sortBy}&q=${q}`;
      if (stockStatus === 'inStock') url += '&inStockOnly=1';
      
      const res = await fetch(url);
      const data = await res.json();
      
      setTotalCount(data.total || 0);
      const mapped: ProductCardProps[] = (data.products ?? []).map((p: any) => ({
        id: p.id, title: p.title, slug: p.slug,
        price: p.price, priceMax: p.priceMax || undefined,
        type: p.type, thumbnail: p.thumbnail || undefined,
        categoryLabel: p.category?.name?.toUpperCase() || '',
        seller: { 
          username: p.seller?.username || 'n/a', 
          isVerified: false, 
          isOnline: p.seller?.isActive || false,
          insuranceBalance: p.seller?.insuranceBalance
        },
        viewCount: p.viewCount, soldCount: p.soldCount, rating: p.rating,
        isSponsored: p.isSponsored,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Failed to fetch filter products:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, priceRange, stockStatus, sortBy, q]);

  useEffect(() => {
    // Fetch all categories for sidebar
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        const cats = data.categories || [];
        setCategories(cats);
        // Find current category info
        const found = cats.find((c: Category) => c.slug === slug);
        setCurrentCategory(found);
      });
  }, [slug]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCatChange = (newSlug: string) => {
    if (newSlug === 'all') router.push('/');
    else router.push(`/danh-muc/${newSlug}`);
  };

  const handleSortChange = (_: any, newValue: string) => {
    setSortBy(newValue);
  };

  const handleSearchClick = () => {
    setQ(tempQ);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchClick();
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 6 }}>
      {/* Breadcrumbs at the top of container */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" sx={{ color: '#cbd5e1' }} />} 
        sx={{ mb: 2 }}
      >
        <MuiLink component={Link} href="/" underline="hover" color="inherit" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
          Trang chủ
        </MuiLink>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
          {currentCategory?.name || 'Danh mục'}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
          <CategorySidebar 
            categories={categories}
            selectedCat={slug}
            onCatChange={handleCatChange}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            stockStatus={stockStatus}
            onStockChange={setStockStatus}
          />
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>
          {/* SEARCH BAR - NEW SECTION */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField 
              fullWidth
              size="small"
              placeholder="Tìm sản phẩm hoặc người bán..."
              value={tempQ}
              onChange={(e) => setTempQ(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' }
              }}
            />
            <Select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as string)}
              sx={{ minWidth: 120, borderRadius: 2, bgcolor: 'white' }}
            >
              <MenuItem value="newest">Mới nhất</MenuItem>
              <MenuItem value="bestseller">Bán chạy</MenuItem>
              <MenuItem value="price_asc">Giá tăng dần</MenuItem>
              <MenuItem value="price_desc">Giá giảm dần</MenuItem>
            </Select>
            <Button 
              variant="contained" 
              onClick={handleSearchClick}
              sx={{ 
                bgcolor: '#fbbf24 !important', color: 'black !important', fontWeight: 800, 
                px: 3, borderRadius: 2, minWidth: 100,
                flexShrink: 0,
                '&:hover': { bgcolor: '#f59e0b !important' } 
              }}
              startIcon={<SearchIcon />}
            >
              Tìm
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {currentCategory?.name || 'Sản phẩm'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Hiển thị 1 - {products.length} trên {totalCount} kết quả
                </Typography>
              </Box>
            </Box>
          </Box>


          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs 
              value={sortBy} 
              onChange={handleSortChange}
              sx={{ 
                minHeight: 40,
                '& .MuiTabs-indicator': { bgcolor: '#16a34a', height: 3 },
                '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', color: '#64748b', fontSize: '0.875rem', minHeight: 40, px: 2 },
                '& .Mui-selected': { color: '#16a34a !important' }
              }}
            >
              <Tab label="Mới nhất" value="newest" />
              <Tab label="Bán chạy" value="bestseller" />
              <Tab label="Giá ↑" value="price_asc" />
              <Tab label="Giá ↓" value="price_desc" />
            </Tabs>
          </Box>

          {/* Special Banner (as seen in image) */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, mb: 4, borderRadius: 2, 
              bgcolor: '#fffbeb', border: '1px solid #fde68a',
              display: 'flex', alignItems: 'center', gap: 1.5
            }}
          >
            <Typography sx={{ fontSize: '1.2rem' }}>ℹ️</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
              Sản phẩm không trùng cam kết bán ra 1 lần duy nhất trên hệ thống.
            </Typography>
          </Paper>

          {/* Product Grid */}
          <Grid container spacing={2}>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                  <Skeleton variant="rounded" height={320} />
                </Grid>
              ))
            ) : products.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">Không tìm thấy sản phẩm nào</Typography>
                </Box>
              </Grid>
            ) : (
              products.map(p => (
                <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                  <ProductCard {...p} />
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default function FilterPage() {
  return (
    <SiteLayout>
      <Suspense fallback={<Skeleton variant="rectangular" height="100vh" />}>
        <FilterPageContent />
      </Suspense>
    </SiteLayout>
  );
}
