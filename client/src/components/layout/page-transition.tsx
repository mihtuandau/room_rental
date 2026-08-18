'use client';

import { usePathname, useSearchParams } from 'next/navigation';

/** Keeps route and search-state changes visually continuous without delaying navigation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const routeKey = isAuthRoute ? 'auth' : `${pathname}?${searchParams.toString()}`;

  return (
    <div key={routeKey} className={isAuthRoute ? undefined : 'page-transition'}>
      {children}
    </div>
  );
}
