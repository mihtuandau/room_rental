---
name: bootstrap-frontend-setup
description: "Set up or repair the RoomRent frontend foundation: React Query, Google OAuth, nuqs, Toaster, API clients, authentication state, providers, and shared constants and utilities. Use before feature work when src/providers, src/lib/api-client.ts, src/lib/server-api.ts, or src/stores/auth-store.ts is absent or incomplete."
---

# Bootstrapping the frontend foundation

Every page and hook depends on these. Check first: if `src/providers/app-providers.tsx` already exists, skip this skill and only add whatever piece is missing.

## 1. Environment

`.env.local` (never committed) and `.env.example` (committed, no real values):

```bash
# Browser-visible: the frontend calls Next's own /api/* routes, so this is only
# used for the rare direct call and for building absolute URLs.
NEXT_PUBLIC_SITE_URL="http://localhost:5000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"

# Server-only (NO NEXT_PUBLIC_ prefix): the real backend origin, used by Server
# Components and Route Handlers. Keeping it server-only means the backend URL
# never ships to the browser.
API_URL="http://localhost:3000"
```

> The backend's own `FRONTEND_URL` must be `http://localhost:5000` — the origin this app runs on — or every browser request is rejected by CORS with an unhelpful "Failed to fetch". Restart the backend after editing its `.env`.

## 2. Auth store — in-memory session signal, cookie-based transport

`src/stores/auth-store.ts`
```ts
import { create } from "zustand";

/**
 * Keep the returned access token only in memory as a signed-in signal — never
 * in localStorage. Route Handlers also store protected session cookies, and
 * /api/proxy reads rr_session to attach Authorization server-side. A reload
 * restores the memory signal through POST /api/auth/refresh.
 */
interface AuthState {
  accessToken: string | null;
  /** false until the first refresh attempt settles, so route guards don't flash */
  isBootstrapped: boolean;
  setAccessToken: (token: string | null) => void;
  setBootstrapped: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isBootstrapped: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setBootstrapped: (isBootstrapped) => set({ isBootstrapped }),
}));
```

## 3. Browser API client

`src/lib/api-client.ts` — used by Client Components only. It talks to Next's own
`/api/proxy/*`, never directly to the backend domain.

```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** class-validator returns an array of messages for a 400 */
    public fieldErrors?: string[],
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    // backend shape: { statusCode, message, timestamp } — message is string | string[]
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const raw = body?.message;
    const list = Array.isArray(raw) ? raw : undefined;
    throw new ApiError(res.status, list?.[0] ?? (raw as string) ?? "Đã có lỗi xảy ra.", list);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
```

## 4. Server-side fetch helper

`src/lib/server-api.ts` — used by Server Components for SEO pages. These calls are
public reads, so they go straight to the backend (no cookie needed, no proxy hop).

```ts
import "server-only";

const API_URL = process.env.API_URL!;

export async function serverFetch<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    next: { revalidate: init?.revalidate ?? 60 },
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  return res.json() as Promise<T>;
}
```

## 5. Providers

`src/lib/query-client.ts`
```ts
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,      // avoids an immediate refetch of server-prefetched data
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
```

`src/providers/app-providers.tsx`
```tsx
"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { makeQueryClient } from "@/lib/query-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // useState so each browser session gets one client — creating it at module
  // scope would share cache across requests during SSR.
  const [queryClient] = useState(makeQueryClient);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          {children}
          <Toaster position="top-center" richColors />
          {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
        </NuqsAdapter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
```

`src/app/layout.tsx` — wrap once, keep the root layout a Server Component:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

## 6. Shared constants

`src/lib/constants.ts` — the single place that maps backend enums to Vietnamese labels.
Duplicating these mappings across components is how they drift out of sync.

```ts
export const ROOM_TYPE_LABELS = {
  boarding_house: "Phòng trọ",
  whole_house: "Nhà nguyên căn",
  mini_apartment: "Chung cư mini",
  serviced_apartment: "Căn hộ dịch vụ",
  shared_room: "Ở ghép",
} as const;

export type RoomType = keyof typeof ROOM_TYPE_LABELS;

export const ROOM_STATUS_LABELS = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  active: "Đang hiển thị",
  hidden: "Đã ẩn",
  rejected: "Bị từ chối",
  expired: "Hết hạn",
} as const;

export const REPORT_REASON_LABELS = {
  fake_listing: "Tin giả",
  wrong_info: "Sai thông tin",
  scam: "Lừa đảo",
  already_rented: "Đã cho thuê",
  other: "Khác",
} as const;
```

## 7. Generate API types

```bash
# backend must be running
pnpm dlx openapi-typescript http://localhost:3000/docs-json -o src/types/api.d.ts
```
Re-run whenever the backend changes. Never hand-edit that file.

## Do NOT
- Create the `QueryClient` at module scope — during SSR that leaks cache between requests.
- Expose the backend origin as `NEXT_PUBLIC_API_URL` — Client Components must go through the proxy, so they never need it.
- Persist the access token to `localStorage` "so refresh works" — that's what the httpOnly refresh cookie is for.

## Checklist
- [ ] `API_URL` is server-only (no `NEXT_PUBLIC_` prefix)
- [ ] `QueryClient` created inside `useState`, not at module scope
- [ ] Providers wrap the app once in the root layout, which stays a Server Component
- [ ] Access token held in memory (Zustand), never persisted
- [ ] `ApiError` handles `message` being either a string or an array
- [ ] Enum→label mappings exist only in `lib/constants.ts`
