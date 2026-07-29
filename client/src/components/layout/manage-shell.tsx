'use client';

import { usePathname } from 'next/navigation';
import { ManageSidebar } from '@/components/layout/manage-sidebar';
import { cn } from '@/lib/utils';

export function ManageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showListingSidebar = !pathname.startsWith('/manage/account');

  return (
    <div className={cn('flex flex-1', showListingSidebar && 'md:pl-64')}>
      {showListingSidebar ? <ManageSidebar /> : null}
      <main className="min-w-0 flex-1 bg-zinc-50">{children}</main>
    </div>
  );
}
