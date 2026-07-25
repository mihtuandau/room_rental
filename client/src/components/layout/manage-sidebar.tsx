'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutGrid, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/features/auth/hooks';
import { useProfile } from '@/features/users/hooks';

// Only two real destinations exist under /manage — a nav item pointing
// nowhere reads as an abandoned dashboard, so this list stays short rather
// than mirroring every section a bigger property-management product might have.
const NAV_ITEMS = [
  { href: '/manage/listings', label: 'Tin của tôi', icon: LayoutGrid },
  { href: '/manage/account', label: 'Tài khoản', icon: Settings },
];

export function ManageSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useProfile();
  const logout = useLogout();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-brand-50/40 md:flex md:flex-col md:justify-between md:py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-white">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote host (Cloudinary), see upload-image-cloudinary skill
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">
              {profile?.fullName || 'Chủ trọ'}
            </p>
            {profile?.isPhoneVerified && (
              <p className="flex items-center gap-1 text-xs text-brand-700">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Đã xác minh SĐT
              </p>
            )}
          </div>
        </div>

        <nav aria-label="Quản lý" className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                  active
                    ? 'bg-brand-600 font-medium text-white'
                    : 'text-zinc-700 hover:bg-white',
                )}
              >
                <item.icon className="h-[18px] w-[18px]" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* No "Về trang tìm phòng" button here — the global Header already shows
          that exact action in manage mode from the sm breakpoint up, and this
          sidebar only appears from md up, so both would double up otherwise. */}
      <div className="space-y-1 border-t border-zinc-200 px-2 pt-6">
        <button
          type="button"
          onClick={async () => {
            await logout.mutateAsync();
            router.push('/');
            router.refresh();
          }}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
