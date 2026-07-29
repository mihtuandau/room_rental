'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

// Keep the sidebar focused on listing management. Account settings remain
// available from the global header's profile menu.
// Only real destinations belong here — a nav item pointing
// nowhere reads as an abandoned dashboard, so this list stays short rather
// than mirroring every section a bigger property-management product might have.
const NAV_ITEMS = [
  { href: '/manage/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/manage/listings', label: 'Tin của tôi', icon: LayoutGrid },
];

export function ManageSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 overflow-hidden border-r border-zinc-200 bg-brand-50/40 md:block md:py-8">
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
    </aside>
  );
}
