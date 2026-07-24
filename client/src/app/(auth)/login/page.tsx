import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/login-form';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { AuthDivider } from '@/features/auth/components/auth-divider';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào RoomRent để lưu tin, đăng tin và quản lý tin đăng của bạn.',
  // A login page has nothing to index and its ?next param shouldn't be crawled.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="rounded-md font-medium text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Đăng ký
          </Link>
        </p>
      </div>

      <Suspense>
        <div className="space-y-6">
          <div className="flex justify-center">
            <GoogleSignInButton />
          </div>
          <AuthDivider />
          <LoginForm />
        </div>
      </Suspense>
    </div>
  );
}
