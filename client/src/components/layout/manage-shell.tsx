'use client';

import Link from 'next/link';
import { BarChart3, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ManageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <main className="min-w-0 flex-1 bg-zinc-50">
        {children}
      </main>
    </div>
  );
}

export function ManageNavigation({ pathname }: { pathname: string }) {
  return (
    <div className="border-b border-zinc-200">
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
        <nav aria-label="Điều hướng quản lý tin đăng" className="flex min-h-12 shrink-0 items-center gap-1">
          <Link href="/manage/dashboard" className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2', pathname.startsWith('/manage/dashboard') ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}>
            <BarChart3 className="h-4 w-4" aria-hidden />
            Tổng quan
          </Link>
          <Link href="/manage/listings" className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2', pathname.startsWith('/manage/listings') ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}>
            <ListChecks className="h-4 w-4" aria-hidden />
            Tin của tôi
          </Link>
        </nav>
      </div>
    </div>
  );
}
