'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { House, X } from 'lucide-react';
import { useIsSignedIn } from '@/stores/auth-store';

export function FloatingLandlordBadge() {
  const [visible, setVisible] = useState(false);
  const isSignedIn = useIsSignedIn();
  const destination = isSignedIn
    ? '/manage/listings/new'
    : '/login?next=%2Fmanage%2Flistings%2Fnew';

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('landlord_badge_dismissed');
    if (!isDismissed) {
      // Delay slightly for smooth entrance after page hydration
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    sessionStorage.setItem('landlord_badge_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Dành cho chủ trọ"
      className="fixed bottom-5 left-5 z-40 hidden max-w-[320px] animate-fade-up sm:block"
    >
      <div className="group relative flex items-center gap-3 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 pr-8 shadow-popover backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-xl">
        <Link
          href={destination}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-xl"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-transform duration-200 group-hover:scale-105">
            <House className="h-5 w-5" aria-hidden />
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold text-zinc-900">
              Bạn có phòng cho thuê?
            </p>
            <p className="mt-0.5 text-xs font-medium text-brand-700 group-hover:text-brand-800 transition-colors">
              Đăng tin miễn phí ngay →
            </p>
          </div>
        </Link>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Đóng thông báo"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
