import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/register-form';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { AuthDivider } from '@/features/auth/components/auth-divider';

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản RoomRent để lưu tin và đăng tin cho thuê.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Đăng ký</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="rounded-md font-medium text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Đăng nhập
          </Link>
        </p>
      </div>

      <Suspense>
        <div className="space-y-6">
          <div className="flex justify-center">
            <GoogleSignInButton />
          </div>
          <AuthDivider />
          <RegisterForm />
        </div>
      </Suspense>

      <p className="text-center text-xs text-zinc-500">
        Khi đăng ký, bạn đồng ý với điều khoản sử dụng của RoomRent.
      </p>
    </div>
  );
}
