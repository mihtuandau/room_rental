import Link from 'next/link';
import { PAGE_SIZE } from '@/features/rooms/search-params';
import { cn } from '@/lib/utils';

export function AreaPagination({
  slug,
  page,
  total,
}: {
  slug: string;
  page: number;
  total: number;
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
      {visible.map((candidate, index) => {
        const previous = visible[index - 1];
        const hasGap =
          previous !== undefined && candidate - previous > 1;
        return (
          <span key={candidate} className="flex items-center gap-1.5">
            {hasGap ? (
              <span className="px-1 text-sm text-zinc-400">…</span>
            ) : null}
            <Link
              href={`/rooms-for-rent/${slug}${
                candidate > 1 ? `?page=${candidate}` : ''
              }`}
              aria-current={candidate === page ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                candidate === page
                  ? 'border-brand-600 bg-brand-600 font-medium text-white'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50',
              )}
            >
              {candidate}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
