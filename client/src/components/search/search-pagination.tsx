'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE } from '@/features/rooms/search-params';
import { cn } from '@/lib/utils';

export function SearchPagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const visible = [...pages]
    .filter((candidate) => candidate >= 1 && candidate <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Phân trang"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      <PageButton
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </PageButton>
      {visible.map((candidate, index) => {
        const previous = visible[index - 1];
        const hasGap =
          previous !== undefined && candidate - previous > 1;
        return (
          <span key={candidate} className="flex items-center gap-1.5">
            {hasGap ? (
              <span className="px-1 text-sm text-zinc-400">…</span>
            ) : null}
            <PageButton
              current={candidate === page}
              onClick={() => onPage(candidate)}
            >
              {candidate}
            </PageButton>
          </span>
        );
      })}
      <PageButton
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </PageButton>
    </nav>
  );
}

function PageButton({
  current,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { current?: boolean }) {
  return (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm tabular-nums transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
        current
          ? 'border-brand-600 bg-brand-600 font-medium text-white'
          : 'border-zinc-200 bg-white hover:bg-zinc-50',
        className,
      )}
      {...props}
    />
  );
}
