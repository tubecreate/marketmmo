'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Rating, LinearProgress,
  Select, MenuItem, FormControl, InputLabel, Avatar,
  Button, TextField, Divider, CircularProgress, alpha
} from '@mui/material';
import SellerLayout from '@/components/layout/SellerLayout';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  sellerReply: string | null;
  sellerReplyAt: string | null;
  createdAt: string;
  product: {
    title: string;
    slug: string;
  };
  order: {
    buyer: {
      username: string;
      avatar: string | null;
    }
  };
}

export default function SellerReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?sellerId=${user?.id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim() || !user?.id) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerReply: replyText, userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã gửi phản hồi thành công');
        setReplyingTo(null);
        setReplyText('');
        fetchReviews();
      } else {
        toast.error(data.error || 'Lỗi khi gửi phản hồi');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setSubmittingReply(false);
    }
  };

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0, distribution: [0,0,0,0,0], responseRate: 0 };
    const count = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = sum / count;
    const distribution = [0, 0, 0, 0, 0];
    let repliedCount = 0;
    reviews.forEach(r => {
      distribution[r.rating - 1]++;
      if (r.sellerReply) repliedCount++;
    });
    const responseRate = (repliedCount / count) * 100;
    return { avg, count, distribution: distribution.reverse(), responseRate };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (starFilter !== 'all') {
      result = result.filter(r => r.rating === parseInt(starFilter));
    }
    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return result;
  }, [reviews, starFilter, sortOrder]);

  return (
    <SellerLayout>
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>Quản lý đánh giá</Typography>
          <Typography variant="body2" color="text.secondary">Lắng nghe ý kiến từ khách hàng để cải thiện dịch vụ.</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Summary Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Tổng quan xếp hạng</Typography>
              
              <Box sx={{ 
                p: 3, 
                mb: 4,
                textAlign: 'center', 
                bgcolor: '#f8fafc', 
                borderRadius: 4,
                border: '1px solid #f1f5f9'
              }}>
                <Typography variant="h2" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                  {stats.avg.toFixed(1)}
                </Typography>
                <Rating value={stats.avg} precision={0.1} readOnly sx={{ my: 1.5, color: '#f59e0b' }} />
                <Typography variant="body2" color="text.secondary">
                  {stats.count} lượt đánh giá
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                {stats.distribution.map((count, i) => {
                  const star = 5 - i;
                  const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
                  return (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="caption" sx={{ minWidth: 40, fontWeight: 600, color: '#64748b' }}>
                        {star} sao
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        sx={{ 
                          flex: 1, 
                          height: 6, 
                          borderRadius: 3, 
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b', borderRadius: 3 }
                        }} 
                      />
                      <Typography variant="caption" sx={{ minWidth: 25, textAlign: 'right', fontWeight: 700 }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Tỉ lệ phản hồi</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                  {stats.responseRate.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.responseRate} 
                sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }} 
              />
            </Paper>
          </Grid>

          {/* Reviews List */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem', fontWeight: 700 }}>XẾP HẠNG</InputLabel>
                    <Select 
                      value={starFilter} 
                      label="XẾP HẠNG"
                      onChange={(e: any) => setStarFilter(e.target.value)}
                      sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                    >
                      <MenuItem value="all">Tất cả sao</MenuItem>
                      {[5, 4, 3, 2, 1].map(s => (
                        <MenuItem key={s} value={s.toString()}>{s} sao</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem', fontWeight: 700 }}>SẮP XẾP</InputLabel>
                    <Select 
                      value={sortOrder} 
                      label="SẮP XẾP"
                      onChange={(e: any) => setSortOrder(e.target.value)}
                      sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                    >
                      <MenuItem value="newest">Mới nhất</MenuItem>
                      <MenuItem value="oldest">Cũ nhất</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* List */}
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress size={32} sx={{ color: '#16a34a' }} />
              </Box>
            ) : filteredReviews.length === 0 ? (
              <Paper sx={{ 
                p: 8, 
                textAlign: 'center', 
                borderRadius: 3, 
                border: '1px dashed #e2e8f0', 
                bgcolor: 'white',
                boxShadow: 'none'
              }}>
                <SentimentVeryDissatisfiedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  Chưa có đánh giá nào phù hợp với bộ lọc.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredReviews.map((rev) => (
                  <Paper key={rev.id} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar sx={{ width: 44, height: 44, bgcolor: alpha('#16a34a', 0.1), color: '#16a34a', fontWeight: 700 }}>
                          {rev.order.buyer.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{rev.order.buyer.username}</Typography>
                          <Rating value={rev.rating} size="small" readOnly sx={{ color: '#f59e0b', my: 0.5 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {format(new Date(rev.createdAt), 'dd MMMM yyyy, HH:mm', { locale: vi })}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', px: 1.5, py: 0.5, bgcolor: alpha('#16a34a', 0.05), borderRadius: 2, height: 'fit-content' }}>
                        {rev.product.title}
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#334155', mb: 3, lineHeight: 1.6 }}>
                      {rev.comment || <i>Người dùng không để lại nhận xét.</i>}
                    </Typography>

                    {rev.sellerReply ? (
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: '#f8fafc', 
                        borderRadius: 2, 
                        borderLeft: '4px solid #16a34a' 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <QuestionAnswerIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>Phản hồi từ người bán</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            {format(new Date(rev.sellerReplyAt!), 'dd/MM/yyyy')}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                          {rev.sellerReply}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {replyingTo === rev.id ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              placeholder="Nhập nội dung phản hồi..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success"
                                disableElevation
                                disabled={submittingReply || !replyText.trim()}
                                onClick={() => handleReply(rev.id)}
                                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
                              >
                                {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="inherit"
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                sx={{ borderRadius: 2, fontWeight: 700, border: '1px solid #e2e8f0' }}
                              >
                                Hủy
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Button 
                            variant="text" 
                            size="small" 
                            startIcon={<QuestionAnswerIcon />}
                            onClick={() => setReplyingTo(rev.id)}
                            sx={{ color: '#16a34a', fontWeight: 700, '&:hover': { bgcolor: alpha('#16a34a', 0.05) } }}
                          >
                            Phản hồi đánh giá
                          </Button>
                        )}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </SellerLayout>
  );
}
