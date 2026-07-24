// Parsers shared by server (createLoader) and client (useQueryStates) must come
// from 'nuqs/server' — the plain 'nuqs' entry ships client stubs without the
// builder methods (.withDefault) when pulled into a Server Component chunk.
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { ROOM_TYPE_LABELS, type RoomType } from '@/lib/constants';
import type { SearchParams } from './api';

const ROOM_TYPE_VALUES = Object.keys(ROOM_TYPE_LABELS) as RoomType[];
export const SORT_VALUES = ['newest', 'price_asc', 'price_desc'] as const;
export const PAGE_SIZE = 12;

/**
 * One parser set, shared by the server (via createSearchParamsCache in the page)
 * and the client (via useQueryStates). Defining it once is what keeps the two in
 * sync — a drift here means the server prefetch and the client hook build
 * different React Query keys and the prefetch is wasted.
 */
export const searchParsers = {
  keyword: parseAsString.withDefault(''),
  city: parseAsString.withDefault(''),
  district: parseAsString.withDefault(''),
  roomType: parseAsStringLiteral(ROOM_TYPE_VALUES),
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  areaMin: parseAsInteger,
  areaMax: parseAsInteger,
  verifiedOnly: parseAsBoolean.withDefault(false),
  amenityIds: parseAsArrayOf(parseAsInteger).withDefault([]),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault('newest'),
  page: parseAsInteger.withDefault(1),
  // UI-only: forces full results mode even with zero filters set (e.g. "Xem
  // tất cả" or pressing the hero's search button with every field on its
  // default). Never sent to the backend — see toSearchParams below.
  all: parseAsBoolean.withDefault(false),
};

/** The parsed nuqs state — the exact shape both useQueryStates and the cache yield. */
export interface SearchState {
  keyword: string;
  city: string;
  district: string;
  roomType: RoomType | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  verifiedOnly: boolean;
  amenityIds: number[];
  sort: (typeof SORT_VALUES)[number];
  page: number;
  all: boolean;
}

/**
 * Normalises the parsed URL state into the backend-facing SearchParams. Both the
 * server prefetch and the client hook call this, so they produce an identical
 * object — and therefore an identical React Query key.
 */
export function toSearchParams(v: SearchState): SearchParams {
  return {
    keyword: v.keyword || undefined,
    city: v.city || undefined,
    district: v.district || undefined,
    roomType: v.roomType ?? undefined,
    priceMin: v.priceMin ?? undefined,
    priceMax: v.priceMax ?? undefined,
    areaMin: v.areaMin ?? undefined,
    areaMax: v.areaMax ?? undefined,
    verifiedOnly: v.verifiedOnly || undefined,
    amenityIds: v.amenityIds.length ? v.amenityIds : undefined,
    sort: v.sort,
    page: v.page,
    pageSize: PAGE_SIZE,
    // `all` is UI-only (browse vs. full-search mode) — never a backend filter.
  };
}

/**
 * Single source of truth for "browse/landing mode" vs. "full search results
 * mode", read identically by HomeHero (which hides its floating search card
 * once expanded) and SearchView (which swaps in the toolbar/filters/map) —
 * two sibling components that only share the URL, not local state.
 */
export function isSearchExpanded(v: SearchState): boolean {
  return (
    v.all ||
    !!v.keyword ||
    !!v.city ||
    !!v.district ||
    !!v.roomType ||
    v.priceMin !== null ||
    v.priceMax !== null ||
    v.areaMin !== null ||
    v.areaMax !== null ||
    v.verifiedOnly ||
    v.amenityIds.length > 0
  );
}
