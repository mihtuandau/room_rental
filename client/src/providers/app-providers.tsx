'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { makeQueryClient } from '@/lib/query-client';
import { useThemeStore } from '@/stores/theme-store';
import { AuthBootstrap } from './auth-bootstrap';
import { ThemeBootstrap } from './theme-bootstrap';

export function AppProviders({ children }: { children: React.ReactNode }) {
  // useState so each browser session gets one client — creating it at module
  // scope would share the cache across requests during SSR
  const [queryClient] = useState(makeQueryClient);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ThemeBootstrap />
          <AuthBootstrap />
          {children}
          <Toaster position="top-center" richColors theme={resolvedTheme} />
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </NuqsAdapter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
