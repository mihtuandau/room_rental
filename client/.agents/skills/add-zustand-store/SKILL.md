---
name: add-zustand-store
description: "Create or modify a Zustand store for RoomRent browser-owned state such as dialogs, drawers, draft filters, multi-step form position, or temporary guest state. Use when Codex must preserve client-side state that has no API source of truth. Keep URL-shareable state in nuqs and server-owned data in React Query."
---

# Creating a Zustand store (UI state only)

## The boundary that matters

**Use Zustand when** the state only exists in the browser and has no source of truth on
the server: filters being edited before submit, open/closed UI, the current step of a
multi-step form, favorites collected while signed out.

**Do not use Zustand when** the data comes from the API (room lists, room detail,
profile, favorites *after* signing in) — that's React Query. If you're about to
`set(...)` with something that came out of a `fetch` or `useQuery`, stop: that's the
signal you've reached for the wrong tool, and you're about to create a second source
of truth that goes stale.

## Prefer the URL over a store for search filters

Search filters belong in the URL — the results page must be shareable, bookmarkable and
indexable. Use `nuqs` rather than a store:

```tsx
"use client";
import { useQueryStates, parseAsString, parseAsInteger, parseAsArrayOf } from "nuqs";

export function useSearchFilters() {
  return useQueryStates({
    keyword: parseAsString,
    city: parseAsString,
    district: parseAsString,
    roomType: parseAsString,
    priceMin: parseAsInteger,
    priceMax: parseAsInteger,
    amenityIds: parseAsArrayOf(parseAsInteger),
    page: parseAsInteger.withDefault(1),
  });
}
```

Reach for a Zustand store only for filters the user is still editing inside a panel
that hasn't been applied yet — for example a mobile filter drawer with an "Apply" button,
where writing to the URL on every keystroke would spam history and refetch constantly.

## Template: draft filters in a mobile filter drawer

`src/stores/use-filter-draft.ts`
```ts
import { create } from "zustand";
import type { RoomType } from "@/lib/constants";

interface FilterDraft {
  roomType?: RoomType;
  priceRange: [number, number];
  amenityIds: number[];
}

interface FilterDraftState extends FilterDraft {
  isOpen: boolean;
  open: (initial: Partial<FilterDraft>) => void;
  close: () => void;
  setRoomType: (roomType?: RoomType) => void;
  setPriceRange: (range: [number, number]) => void;
  toggleAmenity: (id: number) => void;
  reset: () => void;
}

const EMPTY: FilterDraft = {
  roomType: undefined,
  priceRange: [0, 20_000_000],
  amenityIds: [],
};

export const useFilterDraft = create<FilterDraftState>((set) => ({
  ...EMPTY,
  isOpen: false,
  open: (initial) => set({ ...EMPTY, ...initial, isOpen: true }),
  close: () => set({ isOpen: false }),
  setRoomType: (roomType) => set({ roomType }),
  setPriceRange: (priceRange) => set({ priceRange }),
  toggleAmenity: (id) =>
    set((s) => ({
      amenityIds: s.amenityIds.includes(id)
        ? s.amenityIds.filter((a) => a !== id)
        : [...s.amenityIds, id],
    })),
  reset: () => set(EMPTY),
}));
```

On "Apply", copy the draft into the URL — from then on the URL is the source of truth:

```tsx
const draft = useFilterDraft();
const [, setFilters] = useSearchFilters();

function apply() {
  setFilters({
    roomType: draft.roomType ?? null,
    priceMin: draft.priceRange[0] || null,
    priceMax: draft.priceRange[1] || null,
    amenityIds: draft.amenityIds.length ? draft.amenityIds : null,
    page: 1,                   // a filter change must reset pagination
  });
  draft.close();
}
```

## Template: guest favorites

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuestFavoritesState {
  roomIds: number[];
  toggle: (id: number) => void;
  clear: () => void;
}

// persist() is acceptable here specifically because this is throwaway,
// non-sensitive data — never persist tokens or profile data this way.
export const useGuestFavorites = create<GuestFavoritesState>()(
  persist(
    (set) => ({
      roomIds: [],
      toggle: (id) =>
        set((s) => ({
          roomIds: s.roomIds.includes(id)
            ? s.roomIds.filter((r) => r !== id)
            : [...s.roomIds, id],
        })),
      clear: () => set({ roomIds: [] }),
    }),
    { name: "roomrent-guest-favorites" },
  ),
);
```

After sign-in, push these to the server once and clear the store, so there's only one
source of truth again:

```ts
const { roomIds, clear } = useGuestFavorites.getState();
await Promise.all(roomIds.map((id) => apiRequest(`/favorites/${id}`, { method: "POST" })));
clear();
qc.invalidateQueries({ queryKey: ["favorites"] });
```
The favorite endpoints are idempotent, so re-sending an already-saved room is harmless.

## Selecting narrowly to avoid re-renders

```ts
// re-renders on ANY state change in the store
const store = useFilterDraft();

// re-renders only when isOpen changes
const isOpen = useFilterDraft((s) => s.isOpen);
```

## Do NOT
- Store API responses in Zustand.
- Persist tokens, profile data or anything sensitive with `persist()`.
- Use a store for search filters that should live in the URL.
- Subscribe to the whole store when a component only needs one field.

## Checklist
- [ ] State is genuinely client-only, not an API response
- [ ] Search filters use `nuqs`/the URL; a store only holds unapplied drafts
- [ ] `persist()` used only for non-sensitive throwaway data
- [ ] Components select narrowly (`useStore((s) => s.field)`)
- [ ] Guest data is pushed to the server and cleared after sign-in
