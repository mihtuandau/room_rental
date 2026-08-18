'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthPageTransition } from './auth-page-transition';
import { AUTH_PENDING_MOTION_KEY } from './auth-transition-link';

function isSwappedAuthPath(pathname: string) {
  return pathname === '/register' || pathname === '/forgot-password';
}

const AUTH_TRANSITION_KEY = 'tro-oi-auth-route';
const AUTH_VISUAL_SWAP_DELAY = 300;
const AUTH_MOTION_RESET_DELAY = 620;

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSwapped = isSwappedAuthPath(pathname);
  const previousPathname = useRef(pathname);
  const [motion, setMotion] = useState<'to-register' | 'to-login' | null>(null);
  const [visualIsSwapped, setVisualIsSwapped] = useState(isSwapped);
  const [initialIsSwapped] = useState(isSwapped);

  useEffect(() => {
    const pendingMotion = window.sessionStorage.getItem(AUTH_PENDING_MOTION_KEY);
    if (pendingMotion) {
      try {
        const parsed = JSON.parse(pendingMotion) as {
          targetPathname?: string;
          direction?: 'to-register' | 'to-login';
          createdAt?: number;
        };

        if (
          parsed.targetPathname === pathname &&
          parsed.direction &&
          parsed.createdAt &&
          Date.now() - parsed.createdAt < 2000
        ) {
          previousPathname.current = pathname;
          window.sessionStorage.setItem(AUTH_TRANSITION_KEY, pathname);
          const pendingDirection = parsed.direction;
          const pendingMotionTimer = window.setTimeout(() => {
            setVisualIsSwapped(pendingDirection === 'to-register' ? false : true);
            setMotion(pendingDirection);
            window.sessionStorage.removeItem(AUTH_PENDING_MOTION_KEY);
          }, 0);
          return () => window.clearTimeout(pendingMotionTimer);
        }
      } catch {
        // Ignore a stale or malformed transition marker.
      }

      window.sessionStorage.removeItem(AUTH_PENDING_MOTION_KEY);
    }

    const storedPathname = window.sessionStorage.getItem(AUTH_TRANSITION_KEY);
    const sourcePathname = previousPathname.current !== pathname ? previousPathname.current : storedPathname;
    const changedSide = sourcePathname && isSwappedAuthPath(sourcePathname) !== isSwappedAuthPath(pathname);

    previousPathname.current = pathname;
    window.sessionStorage.setItem(AUTH_TRANSITION_KEY, pathname);

    if (!sourcePathname || sourcePathname === pathname || !changedSide) {
      const resetMotionTimer = window.setTimeout(() => {
        setVisualIsSwapped(isSwapped);
        setMotion(null);
      }, 0);
      return () => window.clearTimeout(resetMotionTimer);
    }

    const motionDirection = isSwappedAuthPath(pathname) ? 'to-register' : 'to-login';
    const motionTimer = window.setTimeout(() => setMotion(motionDirection), 0);
    return () => window.clearTimeout(motionTimer);
  }, [isSwapped, pathname]);

  useEffect(() => {
    if (!motion) return;

    const visualSwapTimer = window.setTimeout(() => {
      setVisualIsSwapped(isSwapped);
    }, AUTH_VISUAL_SWAP_DELAY);
    const motionResetTimer = window.setTimeout(() => setMotion(null), AUTH_MOTION_RESET_DELAY);
    return () => {
      window.clearTimeout(visualSwapTimer);
      window.clearTimeout(motionResetTimer);
    };
  }, [isSwapped, motion]);

  return (
    <div className={`auth-split-shell auth-entry ${initialIsSwapped ? 'auth-entry-register' : ''} ${visualIsSwapped ? 'auth-split-register' : ''} ${motion ? `auth-split-motion-${motion}` : ''}`}>
      <aside className="auth-split-brand-panel" aria-label="Giới thiệu Trọ Ơi">
        <div className="auth-brand-visual">
          <Image
            src="/anh_auth_left.png"
            alt="Không gian phòng trọ sáng thoáng"
            fill
            priority
            sizes="60vw"
            className="auth-brand-photo auth-brand-photo-common object-cover"
          />
          <div className="absolute inset-0 bg-brand-900/15" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/28 to-transparent" aria-hidden="true" />
        </div>
        <div className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col justify-end p-6 pb-10 text-white sm:p-8 sm:pb-12 lg:p-12 lg:pb-16">
          <div className="max-w-md">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-zinc-950/25 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-brand-200" aria-hidden="true" />
              <span>Trọ Ơi · Tìm nơi ở an tâm</span>
            </div>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight drop-shadow-sm sm:text-4xl lg:text-5xl">
              {visualIsSwapped ? 'Tạo tài khoản, tìm nơi ở an tâm.' : 'Tìm nơi ở an tâm, đăng tin dễ dàng.'}
            </h2>
            <p className="mt-4 max-w-prose text-sm leading-6 text-white/90 drop-shadow-sm">
              {visualIsSwapped
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
              className="mb-3 inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
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
