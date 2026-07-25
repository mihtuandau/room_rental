'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Goes to the actual previous page (preserving whatever search/filter state
 * the user came from) rather than a hardcoded href — used on pages reached by
 * drilling in from somewhere else (a listing, an area landing page, account).
 */
export function BackButton({
  label = 'Quay lại',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
