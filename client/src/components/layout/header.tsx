'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Bell, Heart, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';
import { useProfile } from '@/features/users/hooks';
import { useFavorites } from '@/features/favorites/hooks';
import { useNotifications } from '@/features/notifications/hooks';

export function Header() {
  const pathname = usePathname();
  const isSignedIn = useIsSignedIn();
  // false until the refresh call settles — rendering "Đăng nhập" before then
  // would flash the wrong state at every signed-in user on every reload
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  // Only fetched once signed in — avatarUrl is the one bit of profile data
  // worth showing globally, everything else stays on the account page itself.
  const { data: profile } = useProfile();
  const { data: favorites } = useFavorites();
  const favoriteCount = favorites?.length ?? 0;
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.unreadCount ?? 0;

  // Two modes, not two accounts: any signed-in user both searches and posts.
  const inManageMode = pathname.startsWith('/manage');
  // Home already has the hero search bar — a header one there is redundant
  // (its own "Tìm kiếm" button already goes to the same expanded results).
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Image src="/logo.png" alt="Trọ Ơi" width={44} height={44} priority className="h-11 w-11" />
        </Link>

        <div className="flex-1" />

        <div className="ml-auto flex items-center gap-2">
          {!isHome && (
            <Button variant="ghost" size="icon" className="sm:hidden" asChild>
              <Link href="/" aria-label="Tìm phòng">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {isBootstrapped && isSignedIn && (
            <>
              <HeaderIconLink href="/notifications" label="Thông báo" count={unreadCount}>
                <Bell className="h-5 w-5" aria-hidden />
              </HeaderIconLink>
              <HeaderIconLink href="/favorites" label="Tin đã lưu" count={favoriteCount}>
                <Heart className="h-5 w-5" aria-hidden />
              </HeaderIconLink>
            </>
          )}

          {inManageMode ? (
            <Button variant="outline" className="hidden sm:inline-flex" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Về trang tìm phòng
              </Link>
            </Button>
          ) : (
            isBootstrapped &&
            isSignedIn && (
              <Button variant="outline" className="hidden sm:inline-flex" asChild>
                <Link href="/manage/listings">Tin của tôi</Link>
              </Button>
            )
          )}

          <Button className="hidden sm:inline-flex" asChild>
            {/* /manage/* is also gated at the edge by middleware.ts, but that's
                a coarse cookie check — this client-side redirect is what
                actually fires reliably regardless of environment quirks there. */}
            <Link
              href={
                isSignedIn
                  ? '/manage/listings/new'
                  : `/login?next=${encodeURIComponent('/manage/listings/new')}`
              }
            >
              Đăng tin
            </Link>
          </Button>

          {!isBootstrapped ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : isSignedIn ? (
            <Link
              href="/manage/account"
              aria-label="Tài khoản của bạn"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote host (Cloudinary), see upload-image-cloudinary skill
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </Link>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderIconLink({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href={href} aria-label={count > 0 ? `${label} (${count})` : label}>
        {children}
        {count > 0 && (
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
