'use client';

import { ChevronDown, House, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/features/auth/hooks';
import { useProfile } from '@/features/users/hooks';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminTopbar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const { data: profile } = useProfile();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
      <form
        className="relative w-full max-w-md"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const search = keyword.trim();
          router.push(search ? `/admin/users?keyword=${encodeURIComponent(search)}` : '/admin/users');
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        <Input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          aria-label="Tìm người dùng"
          placeholder="Tìm người dùng…"
          className="border-zinc-200 bg-zinc-50 pl-9"
        />
      </form>

      <div className="ml-3 flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-2 text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label="Mở menu tài khoản quản trị"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
                {profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary image
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-4 w-4" aria-hidden />
                )}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{profile?.fullName || 'Quản trị viên'}</span>
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-sm font-medium text-zinc-900">{profile?.fullName || 'Quản trị viên'}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500"><ShieldCheck className="h-3 w-3 text-brand-700" aria-hidden />Quản trị viên</p>
          </div>
          <DropdownMenuItem onSelect={() => router.push('/')}>
            <House className="h-4 w-4" aria-hidden />
            Xem trang chủ
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
      </div>
    </header>
  );
}
