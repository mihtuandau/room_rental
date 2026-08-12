import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/register-form';
import { AuthDivider } from '@/features/auth/components/auth-divider';
import { SocialAuthButtons } from '@/features/auth/components/social-auth-buttons';
import { getSafeAuthNext } from '@/features/auth/next-path';

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản Trọ Ơi để lưu tin và đăng tin cho thuê.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: nextParam } = await searchParams;
  const next = getSafeAuthNext(nextParam);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Tạo tài khoản Trọ Ơi</h1>
        <p className="mt-2 text-sm text-zinc-600">Lưu tin yêu thích và đăng phòng dễ dàng hơn.</p>
      </div>

      <div className="space-y-6">
        <SocialAuthButtons next={next} />
        <AuthDivider />
        <RegisterForm next={next} />
      </div>

      <p className="text-center text-sm text-zinc-600">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-medium text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
import Link from 'next/link';
