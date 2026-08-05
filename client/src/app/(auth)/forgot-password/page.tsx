import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
  description: 'Đặt lại mật khẩu Trọ Ơi bằng mã xác minh gửi tới số điện thoại của bạn.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Khôi phục mật khẩu</h1>
        <p className="mt-2 text-sm text-zinc-600">Nhận mã xác minh để đặt lại mật khẩu.</p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-zinc-600">
        Nhớ mật khẩu rồi?{' '}
        <Link href="/login" className="font-medium text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
import Link from 'next/link';
