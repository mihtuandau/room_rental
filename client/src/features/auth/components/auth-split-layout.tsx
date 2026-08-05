'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthPageTransition } from './auth-page-transition';

function isSwappedAuthPath(pathname: string) {
  return pathname === '/register' || pathname === '/forgot-password';
}

const AUTH_TRANSITION_KEY = 'tro-oi-auth-route';

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSwapped = isSwappedAuthPath(pathname);
  const previousPathname = useRef(pathname);
  const [motion, setMotion] = useState<'to-register' | 'to-login' | null>(null);

  useEffect(() => {
    const storedPathname = window.sessionStorage.getItem(AUTH_TRANSITION_KEY);
    const sourcePathname = previousPathname.current !== pathname ? previousPathname.current : storedPathname;
    const changedSide = sourcePathname && isSwappedAuthPath(sourcePathname) !== isSwappedAuthPath(pathname);

    previousPathname.current = pathname;
    window.sessionStorage.setItem(AUTH_TRANSITION_KEY, pathname);

    if (!sourcePathname || sourcePathname === pathname || !changedSide) return;

    setMotion(isSwappedAuthPath(pathname) ? 'to-register' : 'to-login');
    const timeout = window.setTimeout(() => setMotion(null), 620);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className={`auth-split-shell ${isSwapped ? 'auth-split-register' : ''} ${motion ? `auth-split-motion-${motion}` : ''}`}>
      <aside className="auth-split-brand-panel" aria-label="Giới thiệu Trọ Ơi">
        <Image
          src={isSwapped ? '/anh_auth_right.png' : '/anh_auth_left.png'}
          alt="Không gian phòng trọ sáng thoáng"
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
        <div
          className={`absolute inset-0 ${isSwapped ? 'bg-brand-900/10' : 'bg-brand-900/20'}`}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${isSwapped ? 'from-zinc-950/45 via-zinc-950/10' : 'from-zinc-950/65 via-zinc-950/15'} to-transparent`}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col justify-end p-6 pb-10 text-white sm:p-8 sm:pb-12 lg:p-12 lg:pb-16">
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {isSwapped ? 'Tạo tài khoản, tìm nơi ở an tâm.' : 'Tìm nơi ở an tâm, đăng tin dễ dàng.'}
            </h2>
            <p className="mt-4 max-w-prose text-sm leading-6 text-white/80">
              {isSwapped
                ? 'Lưu tin yêu thích và kết nối với chủ trọ đã xác minh.'
                : 'Tin đăng rõ ràng, được kiểm duyệt và cập nhật liên tục.'}
            </p>
          </div>
        </div>
      </aside>

      <section className="auth-split-form-panel">
        <div className="flex min-h-full w-full items-center justify-center p-4 py-8 sm:p-8">
          <div className="flex w-full max-w-sm flex-col items-center">
            <Link
              href="/"
              aria-label="Về trang chủ Trọ Ơi"
              className="mb-5 inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <Image src="/logo.png" alt="Trọ Ơi" width={88} height={88} className="h-16 w-16 object-contain" />
            </Link>
            <AuthPageTransition>{children}</AuthPageTransition>
          </div>
        </div>
      </section>
    </div>
  );
}
