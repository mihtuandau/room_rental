import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});

const themeScript = `
(() => {
  try {
    const stored = JSON.parse(localStorage.getItem('tro-oi-theme') || 'null');
    const preference = stored?.state?.preference || 'system';
    const dark = preference === 'dark' ||
      (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000',
  ),
  applicationName: 'Trọ Ơi',
  title: {
    default: 'Trọ Ơi — Tìm phòng trọ, tin đã xác minh',
    template: '%s | Trọ Ơi',
  },
  description:
    'Tìm phòng trọ, nhà nguyên căn, chung cư mini với tin đăng đã được kiểm duyệt. Cập nhật mỗi ngày.',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Trọ Ơi',
    title: 'Trọ Ơi — Tìm phòng trọ, tin đã xác minh',
    description:
      'Tìm phòng trọ, nhà nguyên căn và chung cư mini với tin đăng đã được kiểm duyệt, cập nhật mỗi ngày.',
    url: '/',
    images: [
      {
        url: '/banner.png',
        alt: 'Trọ Ơi — tìm phòng trọ đã xác minh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trọ Ơi — Tìm phòng trọ, tin đã xác minh',
    description:
      'Tìm phòng trọ, nhà nguyên căn và chung cư mini với tin đăng đã được kiểm duyệt, cập nhật mỗi ngày.',
    images: ['/banner.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
