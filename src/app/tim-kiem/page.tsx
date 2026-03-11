'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import { Box, Container, Typography, Grid, Skeleton, Paper } from '@mui/material';
import ProductCard, { ProductCardProps } from '@/components/products/ProductCard';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import SearchIcon from '@mui/icons-material/Search';

function SearchResults() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || '';
  const [results, setResults] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rawQuery) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(rawQuery)}`)
      .then(res => res.json())
      .then(data => {
        const mapped: ProductCardProps[] = (data.products ?? []).map((p: any) => ({
          id: p.id, title: p.title, slug: p.slug,
          price: p.price, priceMax: p.priceMax || undefined,
          type: p.type, thumbnail: p.thumbnail || undefined,
          categoryLabel: p.category?.name?.toUpperCase() || '',
          seller: { username: p.seller?.username || 'n/a', isVerified: false, isOnline: p.seller?.isActive || false },
          viewCount: p.viewCount, soldCount: p.soldCount, rating: p.rating,
          isSponsored: p.isSponsored,
        }));
        setResults(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rawQuery]);

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '60vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <SearchIcon sx={{ color: '#16a34a', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Kết quả tìm kiếm cho: &quot;<span style={{ color: '#16a34a' }}>{rawQuery}</span>&quot;
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <Skeleton variant="rounded" height={320} />
            </Grid>
          ))}
        </Grid>
      ) : results.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider', bgcolor: 'white' }}>
          <SearchOffIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
            Không tìm thấy kết quả nào phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng thử lại với từ khóa khác (ví dụ: gmail, facebook, netflix...)
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={1.5}>
          {results.map((p) => (
            <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3, xl: 2.4 }}>
              <ProductCard {...p} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default function SearchPage() {
  return (
    <SiteLayout>
      <Suspense fallback={
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Skeleton variant="rounded" height={60} sx={{ mb: 4 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <Skeleton variant="rounded" height={320} />
              </Grid>
            ))}
          </Grid>
        </Container>
      }>
        <SearchResults />
      </Suspense>
    </SiteLayout>
  );
}
