import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | MarketMMO - Sàn Giao Dịch Sản Phẩm Số',
    default: 'MarketMMO - Sàn Giao Dịch Sản Phẩm & Dịch Vụ Số',
  },
  description:
    'Sàn giao dịch trung gian bảo vệ người mua với cơ chế Escrow. Mua bán tài khoản, key phần mềm, dịch vụ số an toàn, uy tín.',
  keywords: ['mua bán tài khoản', 'sàn giao dịch số', 'escrow', 'marketmmo', 'key phần mềm'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </NotificationProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}

