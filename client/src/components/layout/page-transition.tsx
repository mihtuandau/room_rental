'use client';

import { usePathname, useSearchParams } from 'next/navigation';

/** Keeps route and search-state changes visually continuous without delaying navigation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  return (
    <div key={routeKey} className="page-transition">
      {children}
    </div>
  );
}
