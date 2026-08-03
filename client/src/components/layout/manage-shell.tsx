'use client';

import Link from 'next/link';
import { BarChart3, ListChecks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center gap-4 overflow-x-auto px-3">
        <nav aria-label="Điều hướng quản lý tin đăng" className="flex h-16 shrink-0 items-stretch gap-5">
          <Link href="/manage/dashboard" className={cn('inline-flex items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors', pathname.startsWith('/manage/dashboard') ? 'border-brand-600 text-brand-700' : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900')}>
            <BarChart3 className="h-4 w-4" aria-hidden />
            Tổng quan
          </Link>
          <Link href="/manage/listings" className={cn('inline-flex items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors', pathname.startsWith('/manage/listings') ? 'border-brand-600 text-brand-700' : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900')}>
            <ListChecks className="h-4 w-4" aria-hidden />
            Tin của tôi
          </Link>
        </nav>
        {!pathname.startsWith('/manage/listings') && <Button size="sm" className="ml-auto shrink-0" asChild>
          <Link href="/manage/listings/new"><Plus className="h-4 w-4" aria-hidden />Đăng tin mới</Link>
        </Button>}
      </div>
    </div>
  );
}
