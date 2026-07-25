'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';

/** A short, curated subset of ROOM_TYPE_OPTIONS — enough to be useful as quick
 * links without crowding the header; the full list lives in the filters. */
const NAV_CATEGORIES = [
  { href: '/?roomType=boarding_house', label: 'Phòng trọ' },
  { href: '/?roomType=whole_house', label: 'Nhà nguyên căn' },
  { href: '/?roomType=mini_apartment', label: 'Chung cư mini' },
];

export function Header() {
  const pathname = usePathname();
  const isSignedIn = useIsSignedIn();
  // false until the refresh call settles — rendering "Đăng nhập" before then
  // would flash the wrong state at every signed-in user on every reload
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  // Two modes, not two accounts: any signed-in user both searches and posts.
  const inManageMode = pathname.startsWith('/manage');
  // Home already has the hero search bar — a header one there is redundant.
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

        {!inManageMode && (
          <nav
            aria-label="Danh mục"
            className="hidden items-center gap-5 text-sm text-zinc-600 lg:flex"
          >
            <Link
              href="/"
              className={
                isHome
                  ? 'font-medium text-zinc-900'
                  : 'transition-colors hover:text-zinc-900'
              }
            >
              Tìm phòng
            </Link>
            {NAV_CATEGORIES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="transition-colors hover:text-zinc-900"
              >
                {c.label}
              </Link>
            ))}
          </nav>
        )}

        {/* On non-home pages, a search field doubles as a link back to the
            home search — home itself already has the hero search bar. */}
        {isHome ? (
          <div className="flex-1" />
        ) : (
          <Link
            href="/"
            className="hidden h-10 flex-1 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:flex"
          >
            <Search className="h-4 w-4" aria-hidden />
            Tìm theo khu vực, tên đường…
          </Link>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!isHome && (
            <Button variant="ghost" size="icon" className="sm:hidden" asChild>
              <Link href="/" aria-label="Tìm phòng">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {inManageMode ? (
            <Button variant="outline" className="hidden sm:inline-flex" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Về trang tìm phòng
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="hidden sm:inline-flex" asChild>
              <Link href="/manage/listings">Tin của tôi</Link>
            </Button>
          )}

          <Button className="hidden sm:inline-flex" asChild>
            <Link href="/manage/listings/new">Đăng tin</Link>
          </Button>

          {!isBootstrapped ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : isSignedIn ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/manage/account" aria-label="Tài khoản của bạn">
                <UserRound className="h-5 w-5" />
              </Link>
            </Button>
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
