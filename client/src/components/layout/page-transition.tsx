'use client';

import { usePathname } from 'next/navigation';

/** Keeps route changes visually continuous without delaying navigation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
