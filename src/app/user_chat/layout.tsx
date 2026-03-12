import type { Metadata } from 'next';
import SiteLayout from '@/components/layout/SiteLayout';

export const metadata: Metadata = {
  title: 'Nhắn tin | MarketMMO',
  description: 'Trò chuyện và hỗ trợ giao dịch trực tuyến.',
};

export default function UserChatLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
