import type { Metadata } from 'next';
import SiteLayout from '@/components/layout/SiteLayout';

export const metadata: Metadata = {
  title: 'MarketMMO - Sàn Giao Dịch Sản Phẩm & Dịch Vụ Số',
  description: 'Mua bán tài khoản, key phần mềm, dịch vụ số an toàn với cơ chế Escrow bảo hành.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
