import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({
  items,
  className,
  showHomeIcon = false,
}: {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex flex-wrap items-center gap-1.5 text-xs text-zinc-500', className)}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-sm"
      >
        {showHomeIcon && <Home className="h-3.5 w-3.5" aria-hidden />}
        <span>Trang chủ</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" aria-hidden />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="max-w-[200px] truncate text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'max-w-[240px] truncate',
                  isLast ? 'font-medium text-zinc-800' : 'text-zinc-500',
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
