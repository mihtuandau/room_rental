'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  ChevronDown,
  BarChart3,
  Heart,
  ListChecks,
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
  const [isCompact, setIsCompact] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsCompact(currentScrollY > 72);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      const timer = setTimeout(() => setActiveSection(''), 0);
      return () => clearTimeout(timer);
    }

    const handleScroll = () => {
      const sectionIds = ['tim-phong', 'kham-pha', 'tin-moi'];
      const offset = 140; // Combined height of header and category bar + padding
      const scrollPosition = window.scrollY;

      let currentSection = '';

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - offset;
          const bottom = top + rect.height;
          if (scrollPosition >= top && scrollPosition < bottom) {
            currentSection = id;
          }
        }
      }

      // Near top of page fallback
      if (scrollPosition < 50) {
        currentSection = 'tim-phong';
      }

      // Reached bottom of page fallback
      if (window.innerHeight + scrollPosition >= document.documentElement.scrollHeight - 100) {
        currentSection = 'tin-moi';
      }

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const initialTimer = setTimeout(handleScroll, 0);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(initialTimer);
    };
  }, [pathname]);

  const handleHomeLinkClick = (anchorId?: string) => (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      void setUrlState({
        keyword: null,
        city: null,
        district: null,
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
    <header className={cn(
      "sticky top-0 z-40 border-b bg-surface-card/95 backdrop-blur transition-[box-shadow,background-color] duration-200",
      pathname === '/' && !isCompact ? "border-transparent shadow-none" : "border-border-subtle shadow-sm",
    )}>
      <div className={cn(
        "mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6",
      )}>
        <Link
          href="/"
          onClick={handleHomeLinkClick()}
          aria-label="Trọ Ơi — Trang chủ"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            "h-14 w-14 sm:h-16 sm:w-16",
          )}
        >
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={64}
            priority
            className={cn(
              "h-14 w-14 object-contain transition-transform duration-200 sm:h-16 sm:w-16",
              isCompact ? "scale-[0.86]" : "scale-100",
            )}
          />
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center justify-center gap-1 lg:flex"
        >
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleHomeLinkClick(item.id)}
                className={cn(
                  "relative rounded-md px-3 py-2 font-heading text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                  isActive
                    ? "text-brand-700"
                    : "text-zinc-600 hover:bg-surface-subtle hover:text-zinc-900"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
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

          {!inManageMode && (
            isSignedIn ? (
              <Button className="hidden lg:inline-flex" asChild>
                <Link href="/manage/listings/new">
                  Đăng tin
                </Link>
              </Button>
            ) : (
              <Button className="hidden lg:inline-flex" asChild>
                <Link href="/login?next=%2Fmanage%2Flistings%2Fnew">Đăng tin</Link>
              </Button>
            )
          )}

          {!isBootstrapped ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mở menu tài khoản"
                  className="flex h-10 items-center gap-1.5 rounded-full px-1 text-zinc-700 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:px-2"
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
              <DropdownMenuContent align="end" className="w-72">
                <div className="border-b border-border-subtle px-3 py-2">
                  <p className="max-w-48 truncate text-sm font-medium text-zinc-900">
                    {profile?.fullName || 'Tài khoản của bạn'}
                  </p>
                </div>
                <DropdownMenuItem onSelect={() => router.push('/account')} className="gap-3 py-2.5">
                  <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/account/saved-searches')} className="gap-3 py-2.5">
                  <Bookmark className="h-4 w-4 shrink-0" aria-hidden />
                  Tìm kiếm đã lưu
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/manage/listings')} className="gap-3 py-2.5">
                  <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
                  Quản lý tin đăng
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/manage/dashboard')} className="gap-3 py-2.5">
                  <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
                  Thống kê
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onSelect={() => router.push('/admin')} className="gap-3 py-2.5 text-brand-700 focus:bg-brand-50 focus:text-brand-700">
                    <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Trang quản trị (Admin)
                  </DropdownMenuItem>
                )}
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
            profileRole={profile?.role}
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
  profileRole,
}: {
  isSignedIn: boolean;
  inManageMode: boolean;
  onHomeLinkClick: (anchorId?: string) => (e: React.MouseEvent) => void;
  profileRole?: 'user' | 'admin';
}) {

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" aria-hidden />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-[min(22rem,calc(100vw-1rem))]">
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

          <div className="mt-auto space-y-2 border-t border-border-subtle pt-4">
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
                <>
                  {profileRole === 'admin' && (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className={cn(buttonVariants({ variant: 'outline' }), 'w-full border-brand-200 text-brand-700 hover:bg-brand-50 hover:text-brand-700')}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                        Trang quản trị (Admin)
                      </Link>
                    </SheetClose>
                  )}
                  <SheetClose asChild>
                    <Link
                      href="/manage/listings"
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                    >
                      Tin của tôi
                    </Link>
                  </SheetClose>
                </>
              )
            )}

            {!inManageMode && (
              isSignedIn ? (
                <SheetClose asChild>
                  <Link href="/manage/listings/new" className={cn(buttonVariants(), 'w-full')}>
                    Đăng tin
                  </Link>
                </SheetClose>
              ) : (
                <SheetClose asChild>
                  <Link
                    href="/login?next=%2Fmanage%2Flistings%2Fnew"
                    className={cn(buttonVariants(), 'w-full')}
                  >
                    Đăng tin
                  </Link>
                </SheetClose>
              )
            )}
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
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
