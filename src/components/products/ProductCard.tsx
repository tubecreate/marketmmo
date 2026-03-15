'use client';
import React from 'react';
import Link from 'next/link';
import {
  Card, CardContent, CardMedia, Box, Typography,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BoltIcon from '@mui/icons-material/Bolt';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import IconButton from '@mui/material/IconButton';
import { Shield } from 'lucide-react';

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
    insuranceBalance?: number;
  };
  viewCount: number;
  soldCount: number;
  rating?: number;
  isSponsored?: boolean;
  shortDescription?: string;
  status?: string;
  isService?: boolean;
  allowBidding?: boolean;
}

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN');
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
  title, slug, price, thumbnail, type, categoryLabel,
  soldCount, rating, isSponsored, shortDescription, status,
  isService, allowBidding, seller
}: ProductCardProps) {
  const isDigital = type === 'DIGITAL';
  const emoji = getCategoryEmoji(categoryLabel);
  const bgColor = getCategoryBgColor(categoryLabel);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        border: '1px solid #f1f5f9',
        borderRadius: '12px',
        overflow: 'hidden',
        bgcolor: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: '#4cc752',
          boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
          transform: 'translateY(-4px)',
          '& .buy-button': { bgcolor: '#3fb345' }
        },
        position: 'relative',
      }}
    >
      {/* Favorite Icon */}
      <IconButton 
        size="small"
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 10, 
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(4px)',
          '&:hover': { bgcolor: 'white', color: '#ef4444' },
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <FavoriteBorderIcon fontSize="small" sx={{ fontSize: 18 }} />
      </IconButton>

      <Link href={`/san-pham/${slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Thumbnail */}
        <Box sx={{ position: 'relative', height: 160, flexShrink: 0, overflow: 'hidden', bgcolor: '#f8fafc' }}>
          {thumbnail ? (
            <CardMedia
              component="img"
              image={thumbnail}
              alt={title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: bgColor,
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
              }}
            >
              {emoji}
            </Box>
          )}

          {/* Badges Overlay */}
          <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {categoryLabel && (
              <Box sx={{ 
                bgcolor: '#0f172a', color: 'white', fontSize: '0.6rem', fontWeight: 800, px: 1, py: 0.4, borderRadius: '6px', 
                textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}>
                {categoryLabel}
              </Box>
            )}
            {seller.insuranceBalance !== undefined && seller.insuranceBalance > 0 && (
              <Box sx={{ 
                bgcolor: '#fbbf24', color: '#000', fontSize: '0.65rem', fontWeight: 900, px: 1, py: 0.5, borderRadius: '6px', 
                display: 'flex', alignItems: 'center', gap: 0.5, textTransform: 'uppercase',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 4px 8px rgba(251, 191, 36, 0.4)',
                animation: 'pulse-glow 2s infinite'
              }}>
                <Shield size={12} fill="currentColor" />
                BH {formatPrice(seller.insuranceBalance)}
              </Box>
            )}
          </Box>

          {/* Closed Overlay */}
          {status === 'CLOSED' && (
            <Box sx={{ 
              position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)', 
              zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(2px)'
            }}>
              <Typography sx={{ 
                bgcolor: '#ef4444', color: 'white', px: 2, py: 0.6, 
                borderRadius: 1, fontWeight: 900, fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                transform: 'rotate(-5deg)'
              }}>
                ĐÃ ĐÓNG
              </Typography>
            </Box>
          )}
        </Box>

        {/* Content */}
        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1, '&:last-child': { pb: 2 } }}>
          <Box>
            <Typography variant="caption" sx={{ color: isService ? '#f59e0b' : (isDigital ? '#4cc752' : '#7c3aed'), fontWeight: 800, fontSize: '0.6rem', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {isService ? 'DỊCH VỤ' : (isDigital ? 'SẢN PHẨM SỐ' : 'DỊCH VỤ TÀI KHOẢN')}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                lineHeight: 1.3,
                color: '#1e293b',
                mt: 0.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.3rem',
              }}
            >
              {title}
            </Typography>
            {shortDescription && (
              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontWeight: 500
                }}
              >
                {shortDescription}
              </Typography>
            )}
          </Box>

          {/* Price Section */}
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              {(isService && allowBidding) || price === 0 ? (
                <Typography sx={{ fontWeight: 800, color: '#ef4444', fontSize: '1.25rem' }}>
                  Thỏa thuận
                </Typography>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem' }}>
                    {formatPrice(price)}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.75rem' }}>
                    VNĐ
                  </Typography>
                </>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <StarRoundedIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{rating || 5.0}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                Đã bán {soldCount}
              </Typography>
            </Box>
          </Box>

          {/* Buy Button */}
          <Box
            className="buy-button"
            sx={{
              bgcolor: status === 'CLOSED' ? '#94a3b8' : (isService && allowBidding ? '#ef4444' : '#4cc752'),
              color: 'white',
              textAlign: 'center',
              py: 1.2,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              transition: 'background-color 0.2s ease',
              mt: 1,
            }}
          >
            {status === 'CLOSED' ? 'Tạm ngưng' : (isService && allowBidding ? 'Thương lượng' : 'Mua ngay')}
          </Box>
        </CardContent>
      </Link>
    </Card>
  );
}
