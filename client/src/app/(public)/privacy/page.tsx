import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { PrivacyPolicyContent } from './_components/privacy-policy-content';

export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư',
  description:
    'Tìm hiểu cách Trọ Ơi thu thập, sử dụng và bảo vệ dữ liệu cá nhân khi bạn tìm phòng, đăng tin và sử dụng tài khoản.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Chính sách quyền riêng tư | Trọ Ơi',
    description:
      'Thông tin minh bạch về dữ liệu cá nhân, cookie đăng nhập và các dịch vụ hỗ trợ Trọ Ơi.',
    type: 'website',
    url: '/privacy',
  },
};

const LAST_UPDATED = '30/07/2026';

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="border-b border-zinc-200 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Chính sách quyền riêng tư
        </h1>
        <p className="mt-3 max-w-prose text-base leading-7 text-zinc-600">
          Trọ Ơi tôn trọng quyền riêng tư của bạn. Chính sách này giải thích
          những dữ liệu được thu thập, mục đích sử dụng và cách dữ liệu được bảo
          vệ khi bạn tìm phòng, đăng tin hoặc sử dụng tài khoản.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Cập nhật lần cuối: {LAST_UPDATED}
        </p>
      </header>
      <PrivacyPolicyContent />
    </div>
  );
}
