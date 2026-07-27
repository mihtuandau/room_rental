'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  FileWarning,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Người dùng', icon: UsersRound },
];

const UPCOMING_NAV_ITEMS = [
  { label: 'Duyệt tin', icon: ClipboardCheck },
  { label: 'Báo cáo', icon: FileWarning },
  { label: 'Tiện ích', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-brand-50/40 md:flex md:flex-col md:justify-between md:py-8">
      <div className="space-y-8">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Quản trị RoomRent</p>
            <p className="text-xs text-zinc-600">Khu vực quản trị</p>
          </div>
        </Link>

        <nav aria-label="Quản trị" className="space-y-1 px-2">
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
          {UPCOMING_NAV_ITEMS.map((item) => (
            <span
              key={item.label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-400"
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden />
              {item.label}
            </span>
          ))}
        </nav>
      </div>

      <div className="border-t border-zinc-200 px-4 pt-6 text-xs text-zinc-500">RoomRent Admin</div>
    </aside>
  );
}
