// Parsers shared by server (createLoader) and client (useQueryStates) must come
// from 'nuqs/server' — the plain 'nuqs' entry ships client stubs without the
// builder methods (.withDefault) when pulled into a Server Component chunk.
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { ROOM_TYPE_LABELS, type RoomType } from '@/lib/constants';
import type { SearchParams } from './api';

const ROOM_TYPE_VALUES = Object.keys(ROOM_TYPE_LABELS) as RoomType[];
export const SORT_VALUES = ['newest', 'price_asc', 'price_desc'] as const;
export const SEARCH_MODE_VALUES = ['area', 'nearby'] as const;
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
  provinceCode: parseAsInteger,
  district: parseAsString.withDefault(''),
  ward: parseAsString.withDefault(''),
  wardCode: parseAsInteger,
  roomType: parseAsStringLiteral(ROOM_TYPE_VALUES),
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  // Listing/search APIs accept decimal square metres (e.g. 18.5), while the
  // UI slider still uses a simpler 5 m² step for normal interactions.
  areaMin: parseAsFloat,
  areaMax: parseAsFloat,
  verifiedOnly: parseAsBoolean.withDefault(false),
  amenityIds: parseAsArrayOf(parseAsInteger).withDefault([]),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault('newest'),
  mode: parseAsStringLiteral(SEARCH_MODE_VALUES).withDefault('area'),
  lat: parseAsString,
  lng: parseAsString,
  radiusKm: parseAsInteger,
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
  provinceCode: number | null;
  district: string;
  ward: string;
  wardCode: number | null;
  roomType: RoomType | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  verifiedOnly: boolean;
  amenityIds: number[];
  sort: (typeof SORT_VALUES)[number];
  mode: (typeof SEARCH_MODE_VALUES)[number];
  lat: string | null;
  lng: string | null;
  radiusKm: number | null;
  page: number;
  all: boolean;
}

/**
 * Normalises the parsed URL state into the backend-facing SearchParams. Both the
 * server prefetch and the client hook call this, so they produce an identical
 * object — and therefore an identical React Query key.
 */
export function toSearchParams(v: SearchState): SearchParams {
  const hasRadiusSearch = v.mode === 'nearby' && v.lat && v.lng;

  return {
    keyword: v.keyword || undefined,
    city: hasRadiusSearch ? undefined : v.city || undefined,
    provinceCode: hasRadiusSearch ? undefined : v.provinceCode ?? undefined,
    district: hasRadiusSearch ? undefined : v.district || undefined,
    ward: hasRadiusSearch ? undefined : v.ward || undefined,
    wardCode: hasRadiusSearch ? undefined : v.wardCode ?? undefined,
    roomType: v.roomType ?? undefined,
    priceMin: v.priceMin ?? undefined,
    priceMax: v.priceMax ?? undefined,
    areaMin: v.areaMin ?? undefined,
    areaMax: v.areaMax ?? undefined,
    lat: hasRadiusSearch ? v.lat ?? undefined : undefined,
    lng: hasRadiusSearch ? v.lng ?? undefined : undefined,
    radiusKm: hasRadiusSearch ? (v.radiusKm ?? 3) : undefined,
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
    v.provinceCode !== null ||
    !!v.district ||
    !!v.ward ||
    v.wardCode !== null ||
    !!v.roomType ||
    v.priceMin !== null ||
    v.priceMax !== null ||
    v.areaMin !== null ||
    v.areaMax !== null ||
    v.verifiedOnly ||
    v.amenityIds.length > 0 ||
    v.mode === 'nearby'
  );
}
