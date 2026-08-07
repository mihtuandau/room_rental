import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { AuthDivider } from '@/features/auth/components/auth-divider';
import { SocialAuthButtons } from '@/features/auth/components/social-auth-buttons';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào Trọ Ơi để lưu tin, đăng tin và quản lý tin đăng của bạn.',
  // A login page has nothing to index and its ?next param shouldn't be crawled.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Chào mừng trở lại</h1>
        <p className="mt-2 text-sm text-zinc-600">Đăng nhập để tiếp tục tìm phòng phù hợp.</p>
      </div>

      <Suspense>
        <div className="space-y-6">
          <SocialAuthButtons />
          <AuthDivider />
          <LoginForm />
        </div>
      </Suspense>

      <p className="text-center text-sm text-zinc-600">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-medium text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
