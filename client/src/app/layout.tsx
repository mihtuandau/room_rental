import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000'),
  title: {
    default: 'Trọ Ơi — Tìm phòng trọ, tin đã xác minh',
    template: '%s | Trọ Ơi',
  },
  description:
    'Tìm phòng trọ, nhà nguyên căn, chung cư mini với tin đăng đã được kiểm duyệt. Cập nhật mỗi ngày.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
