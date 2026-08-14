import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { TermsContent } from './_components/terms-content';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description:
    'Điều khoản sử dụng dịch vụ Trọ Ơi — nền tảng tìm phòng trọ đã xác minh tại Việt Nam.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Điều khoản sử dụng | Trọ Ơi',
    description:
      'Điều khoản sử dụng dịch vụ Trọ Ơi — nền tảng tìm phòng trọ đã xác minh tại Việt Nam.',
    type: 'website',
    url: '/terms',
  },
};

const LAST_UPDATED = '30/07/2026';

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="border-b border-zinc-200 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Scale className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Điều khoản sử dụng
        </h1>
        <p className="mt-3 max-w-prose text-base leading-7 text-zinc-600">
          Vui lòng đọc kỹ các điều khoản dưới đây trước khi đăng ký tài khoản,
          sử dụng dịch vụ và đăng tin trên nền tảng Trọ Ơi.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Cập nhật lần cuối: {LAST_UPDATED}
        </p>
      </header>
      <TermsContent />
    </div>
  );
}
