'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { useProfile } from '@/features/users/hooks';
import { useFavorites } from '@/features/favorites/hooks';
import { useNotifications } from '@/features/notifications/hooks';
import { cn } from '@/lib/utils';
import { useQueryStates } from 'nuqs';
import { searchParsers } from '@/features/rooms/search-params';

const PUBLIC_NAV_ITEMS = [
  { href: '/#tim-phong', label: 'Tìm phòng', id: 'tim-phong' },
  { href: '/#kham-pha', label: 'Khám phá', id: 'kham-pha' },
  { href: '/#tin-moi', label: 'Tin mới', id: 'tin-moi' },
] as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const logout = useLogout();
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

  const [, setUrlState] = useQueryStates(searchParsers);

  const handleHomeLinkClick = (anchorId?: string) => (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      void setUrlState({
        keyword: null,
        city: null,
        ward: null,
        roomType: null,
        priceMin: null,
        priceMax: null,
        areaMin: null,
        areaMax: null,
        verifiedOnly: null,
        amenityIds: null,
        sort: null,
        mode: null,
        lat: null,
        lng: null,
        radiusKm: null,
        all: null,
        page: null,
      }).then(() => {
        if (anchorId) {
          const el = document.getElementById(anchorId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 shadow-card backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          onClick={handleHomeLinkClick()}
          aria-label="Trọ Ơi — Trang chủ"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={64}
            priority
            className="h-16 w-16 object-contain"
          />
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-1 lg:flex"
        >
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleHomeLinkClick(item.id)}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="ml-auto flex items-center gap-2">
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
            <Button variant="outline" className="hidden lg:inline-flex" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Về trang tìm phòng
              </Link>
            </Button>
          ) : (
            isBootstrapped &&
            isSignedIn && (
              <Button variant="outline" className="hidden lg:inline-flex" asChild>
                <Link href="/manage/listings">Tin của tôi</Link>
              </Button>
            )
          )}

          <Button className="hidden lg:inline-flex" asChild>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mở menu tài khoản"
                  className="flex h-10 items-center gap-1 rounded-md px-1 text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:px-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
                    {profile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote host (Cloudinary), see upload-image-cloudinary skill
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 sm:block" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="border-b border-zinc-100 px-3 py-2">
                  <p className="max-w-48 truncate text-sm font-medium text-zinc-900">
                    {profile?.fullName || 'Tài khoản của bạn'}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">Quản lý thông tin và tin đăng</p>
                </div>
                <DropdownMenuItem onSelect={() => router.push('/account')}>
                  <UserRound className="h-4 w-4" aria-hidden />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/account/security')}>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Bảo mật
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={logout.isPending}
                  onSelect={() => {
                    void logout.mutateAsync().then(() => {
                      router.push('/');
                      router.refresh();
                    });
                  }}
                  className="mt-1 text-danger-600 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {logout.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" className="px-2 sm:px-4" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}

          <MobileNavigation
            isSignedIn={isSignedIn}
            inManageMode={inManageMode}
            onHomeLinkClick={handleHomeLinkClick}
          />
        </div>
      </div>
    </header>
  );
}

function MobileNavigation({
  isSignedIn,
  inManageMode,
  onHomeLinkClick,
}: {
  isSignedIn: boolean;
  inManageMode: boolean;
  onHomeLinkClick: (anchorId?: string) => (e: React.MouseEvent) => void;
}) {
  const postHref = isSignedIn
    ? '/manage/listings/new'
    : `/login?next=${encodeURIComponent('/manage/listings/new')}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" aria-hidden />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Tìm phòng và quản lý tin đăng của bạn.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col">
          <nav aria-label="Điều hướng trên thiết bị di động">
            <ul className="space-y-2">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      onClick={onHomeLinkClick(item.id === 'tim-phong' ? undefined : item.id)}
                      className="flex h-10 items-center rounded-md px-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto space-y-2 border-t border-zinc-100 pt-4">
            {inManageMode ? (
              <SheetClose asChild>
                <Link
                  href="/"
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Về trang tìm phòng
                </Link>
              </SheetClose>
            ) : (
              isSignedIn && (
                <SheetClose asChild>
                  <Link
                    href="/manage/listings"
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                  >
                    Tin của tôi
                  </Link>
                </SheetClose>
              )
            )}

            <SheetClose asChild>
              <Link href={postHref} className={cn(buttonVariants(), 'w-full')}>
                Đăng tin
              </Link>
            </SheetClose>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
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
