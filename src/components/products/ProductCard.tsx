'use client';
import React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardMedia, Box, Typography,
  Avatar,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VerifiedIcon from '@mui/icons-material/Verified';
import CircleIcon from '@mui/icons-material/Circle';

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceMax?: number;
  thumbnail?: string;
  type: 'DIGITAL' | 'SERVICE';
  category?: string;
  categoryLabel?: string;
  seller: {
    username: string;
    avatar?: string;
    isVerified?: boolean;
    isOnline?: boolean;
    lastActive?: string;
  };
  viewCount: number;
  soldCount: number;
  rating?: number;
  isSponsored?: boolean;
}

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}tr`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}k`;
  return `${price}`;
}

// Emoji thumbnails based on category keyword
function getCategoryEmoji(categoryLabel?: string): string {
  const label = (categoryLabel || '').toLowerCase();
  if (label.includes('facebook') || label.includes('fb')) return '📘';
  if (label.includes('gmail') || label.includes('email')) return '📧';
  if (label.includes('twitter') || label.includes('x')) return '🐦';
  if (label.includes('tiktok')) return '🎵';
  if (label.includes('youtube')) return '▶️';
  if (label.includes('capcut')) return '🎬';
  if (label.includes('github')) return '🐙';
  if (label.includes('clone')) return '📱';
  if (label.includes('proxy')) return '🌐';
  if (label.includes('ads')) return '📣';
  if (label.includes('marketing')) return '📊';
  return '🛍️';
}

function getCategoryBgColor(categoryLabel?: string): string {
  const label = (categoryLabel || '').toLowerCase();
  if (label.includes('facebook') || label.includes('fb')) return 'linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)';
  if (label.includes('gmail') || label.includes('email')) return 'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)';
  if (label.includes('twitter')) return 'linear-gradient(135deg, #1da1f2 0%, #71b7e6 100%)';
  if (label.includes('tiktok')) return 'linear-gradient(135deg, #010101 0%, #69c9d0 100%)';
  if (label.includes('capcut')) return 'linear-gradient(135deg, #1a1a1a 0%, #404040 100%)';
  if (label.includes('clone')) return 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)';
  if (label.includes('ads') || label.includes('marketing')) return 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)';
  return 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)';
}

export default function ProductCard({
  title, slug, price, priceMax, thumbnail, type, categoryLabel,
  seller, viewCount, soldCount, rating, isSponsored,
}: ProductCardProps) {
  const isDigital = type === 'DIGITAL';
  const emoji = getCategoryEmoji(categoryLabel);
  const bgColor = getCategoryBgColor(categoryLabel);

  return (
    <Card
      component={Link}
      href={`/san-pham/${slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#16a34a',
          boxShadow: '0 6px 20px rgba(22,163,74,0.14)',
          transform: 'translateY(-2px)',
        },
        position: 'relative',
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ position: 'relative', height: 180, flexShrink: 0, overflow: 'hidden' }}>
        {thumbnail ? (
          <CardMedia
            component="img"
            image={thumbnail}
            alt={title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
            }}
          >
            {emoji}
          </Box>
        )}

        {/* Top badges row */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Category label (left) */}
          {categoryLabel && (
            <Box
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 700,
                px: 0.6,
                py: 0.15,
                borderRadius: 1,
                letterSpacing: 0.3,
                maxWidth: '65%',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {categoryLabel.toUpperCase()}
            </Box>
          )}
          {/* Sponsored badge (right) */}
          {isSponsored && (
            <Box
              sx={{
                bgcolor: '#f59e0b',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 700,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                letterSpacing: 0.3,
                ml: 'auto',
              }}
            >
              TÀI TRỢ
            </Box>
          )}
        </Box>

        {/* Bottom type badge */}
        <Box sx={{ position: 'absolute', bottom: 8, left: 8 }}>
          <Box
            sx={{
              bgcolor: isDigital ? '#16a34a' : '#7c3aed',
              color: 'white',
              fontSize: '0.58rem',
              fontWeight: 700,
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              letterSpacing: 0.5,
            }}
          >
            {isDigital ? 'SẢN PHẨM' : 'DỊCH VỤ'}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75, '&:last-child': { pb: 1.5 } }}>
        {/* Seller row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={seller.avatar}
              sx={{
                width: 20,
                height: 20,
                fontSize: '0.65rem',
                bgcolor: '#16a34a',
                fontWeight: 700,
              }}
            >
              {seller.username[0].toUpperCase()}
            </Avatar>
            {seller.isOnline && (
              <CircleIcon
                sx={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  fontSize: 8,
                  color: '#22c55e',
                  bgcolor: 'white',
                  borderRadius: '50%',
                }}
              />
            )}
          </Box>
          <Typography
            variant="caption"
            sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {seller.username}
          </Typography>
          {seller.isVerified && (
            <VerifiedIcon sx={{ fontSize: 13, color: '#16a34a', flexShrink: 0 }} />
          )}
          {seller.isOnline ? (
            <Box
              sx={{
                bgcolor: '#dcfce7',
                color: '#16a34a',
                fontSize: '0.58rem',
                fontWeight: 700,
                px: 0.6,
                py: 0.1,
                borderRadius: 0.75,
                flexShrink: 0,
              }}
            >
              ONLINE
            </Box>
          ) : seller.lastActive ? (
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', flexShrink: 0 }}>
              {seller.lastActive}
            </Typography>
          ) : null}
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.82rem',
            lineHeight: 1.45,
            color: '#0f172a',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4rem',
            flex: 1,
          }}
        >
          {title}
        </Typography>

        {/* Stats row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <VisibilityOutlinedIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(0)}k` : viewCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount}
            </Typography>
          </Box>
          {rating !== undefined && rating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, ml: 'auto' }}>
              <StarRoundedIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#78716c' }}>
                {rating.toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price */}
        <Box sx={{ borderTop: '1px solid #f1f5f9', pt: 0.75 }}>
          <Typography
            component="div"
            sx={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem', lineHeight: 1.2 }}
          >
            {formatPrice(price)}
            {priceMax && priceMax !== price && (
              <Box component="span">
                {' – '}{formatPrice(priceMax)}
              </Box>
            )}
            <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 600, ml: 0.25 }}>
              VNĐ
            </Box>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
