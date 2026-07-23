---
name: add-react-query-hook
description: Write React Query hooks (useQuery/useMutation) for RoomRent frontend features — room search, favorites, saved searches, reports, posting a listing, revealing a landlord's contact. MUST use this skill whenever a Client Component needs to fetch or send data — even when the user just says "make the save button work", "load more on scroll", "submit form X". Enforces splitting api.ts from hooks.ts, calling through the proxy route, and consistent query keys so invalidation hits the right cache.
---

# Writing a React Query hook

Use this for all server data in Client Components. Never hand-roll `useEffect` +
`useState` fetching — React Query gives caching, loading/error states and retries for free.

## Rules

- Two files: `api.ts` (plain fetch functions, no React) and `hooks.ts` (React Query wrappers).
- Call `/api/proxy/...` — never the backend domain directly (HARD RULE #1). `apiRequest`
  from `lib/api-client.ts` already prefixes it.
- Query keys are structured arrays so `invalidateQueries` can target precisely:
  `["rooms", "search", filters]`, `["rooms", "detail", slug]`, `["favorites"]`.
- After a mutation, invalidate the specific related keys — never call `invalidateQueries()`
  with no key, which wipes the whole cache.

## Template: `api.ts`

`src/features/rooms/api.ts`
```ts
import { apiRequest } from "@/lib/api-client";
import type { RoomType } from "@/lib/constants";

export interface SearchParams {
  keyword?: string;
  city?: string;
  district?: string;
  roomType?: RoomType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  /** backend expects a comma-separated list, and requires ALL of them to match */
  amenityIds?: number[];
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export function buildSearchQuery(params: SearchParams) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" ) continue;
    qs.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return qs.toString();
}

export function fetchRooms(params: SearchParams) {
  return apiRequest<{ rooms: Room[]; total: number; page: number; pageSize: number }>(
    `/rooms?${buildSearchQuery(params)}`,
  );
}

export function createRoom(payload: CreateRoomInput) {
  return apiRequest<Room>("/rooms", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchMyRooms() {
  return apiRequest<Room[]>("/rooms/mine");
}

/** Reveals the landlord's contact info; the backend logs every call. */
export function revealContact(roomId: number, type: "phone" | "zalo" | "message") {
  return apiRequest<{ contactPhone: string | null; zaloUrl: string | null }>(
    `/rooms/${roomId}/contact`,
    { method: "POST", body: JSON.stringify({ type }) },
  );
}
```

## Template: `hooks.ts` — queries

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchRooms, fetchMyRooms, type SearchParams } from "./api";

export const roomKeys = {
  all: ["rooms"] as const,
  search: (params: SearchParams) => [...roomKeys.all, "search", params] as const,
  detail: (slug: string) => [...roomKeys.all, "detail", slug] as const,
  mine: () => [...roomKeys.all, "mine"] as const,
};

export function useRoomsSearch(params: SearchParams) {
  return useQuery({
    queryKey: roomKeys.search(params),
    queryFn: () => fetchRooms(params),
    staleTime: 30_000,
  });
}

export function useMyRooms() {
  return useQuery({ queryKey: roomKeys.mine(), queryFn: fetchMyRooms });
}
```

> A `roomKeys` factory keeps keys consistent. Typing the same array literal by hand
> in several files is how invalidation silently stops matching.

## Template: `hooks.ts` — mutations

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { createRoom } from "./api";
import { roomKeys } from "./hooks";

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.mine() });
      toast.success("Đã gửi tin, đang chờ admin duyệt.");
    },
    onError: (err) => {
      // e.g. 400 "Add a contact phone number to your profile before posting a listing."
      toast.error(err instanceof ApiError ? err.message : "Không tạo được tin đăng.");
    },
  });
}
```

## Template: optimistic favorite toggle

The heart icon must feel instant, and the backend endpoints are idempotent, so an
optimistic update is safe here.

```ts
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, isFavorite }: { roomId: number; isFavorite: boolean }) =>
      apiRequest(`/favorites/${roomId}`, { method: isFavorite ? "DELETE" : "POST" }),
    onMutate: async ({ roomId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: ["favorites"] });
      const previous = qc.getQueryData<Room[]>(["favorites"]);
      qc.setQueryData<Room[]>(["favorites"], (old = []) =>
        isFavorite ? old.filter((r) => r.id !== roomId) : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["favorites"], ctx?.previous); // roll back
      toast.error("Không lưu được, thử lại nhé.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
```

## Template: using it — all three states are required

```tsx
"use client";
import { useRoomsSearch } from "@/features/rooms/hooks";

export function RoomSearchResults({ filters }: { filters: SearchParams }) {
  const { data, isPending, isError } = useRoomsSearch(filters);

  if (isPending) return <RoomListSkeleton />;
  if (isError) return <ErrorState message="Không tải được danh sách phòng." />;
  if (data.rooms.length === 0) return <EmptyState message="Không tìm thấy phòng phù hợp." />;

  return <RoomGrid rooms={data.rooms} total={data.total} />;
}
```

## Reusing a Server Component's fetch (no double fetching)

When a page needs SEO *and* client interaction over the same data:

```tsx
// page.tsx — Server Component
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import { serverFetch } from "@/lib/server-api";

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = await searchParams;
  const qc = makeQueryClient();

  await qc.prefetchQuery({
    queryKey: roomKeys.search(filters),          // must match the client key exactly
    queryFn: () => serverFetch(`/rooms?${buildSearchQuery(filters)}`),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <RoomSearchResults filters={filters} />
    </HydrationBoundary>
  );
}
```

If the prefetch key doesn't match the hook's key character for character, the client
refetches immediately and the prefetch was wasted.

## Do NOT
- Call the backend origin directly from a Client Component.
- Use `useEffect` to fetch instead of React Query.
- Call `invalidateQueries()` with no key.
- Copy `useQuery` results into Zustand "to be safe" — React Query owns that cache.

## Checklist
- [ ] `api.ts` and `hooks.ts` are separate
- [ ] Requests go through `apiRequest` (i.e. `/api/proxy/...`)
- [ ] Query keys come from a key factory, not hand-typed arrays
- [ ] Mutations invalidate specific related keys
- [ ] Component handles `isPending` / `isError` / empty
- [ ] Server prefetch keys match the client hook keys exactly
