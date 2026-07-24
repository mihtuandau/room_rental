import { apiRequest } from '@/lib/api-client';
import type { AmenityType, RoomType } from '@/lib/constants';
import type { RoomCardItem } from '@/components/rooms/room-card';

export interface RoomImage {
  id: string;
  url: string;
  isCover: boolean;
  position: number;
}

export interface RoomOwner {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  contactPhone: string | null;
  zaloUrl: string | null;
}

export interface RoomAmenity {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  type: AmenityType;
}

/** Full listing as returned by GET /rooms/:slug. */
export interface RoomDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  roomType: RoomType;
  price: number;
  area: number | null;
  deposit: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maxOccupants: number | null;
  city: string;
  district: string;
  ward: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
  viewCount: number;
  images: RoomImage[];
  owner: RoomOwner;
  amenities: RoomAmenity[];
}

/**
 * Reveals a landlord's contact info. The backend logs every call into ContactLog
 * (HARD RULE #10) — this is why the phone isn't shown until the user asks.
 */
export function revealContact(roomId: number, type: 'phone' | 'zalo' | 'message') {
  return apiRequest<{ contactPhone: string | null; zaloUrl: string | null }>(
    `/rooms/${roomId}/contact`,
    { method: 'POST', body: JSON.stringify({ type }) },
  );
}

/** URL/query param names match the backend's SearchRoomsDto so no mapping is needed. */
export interface SearchParams {
  keyword?: string;
  city?: string;
  district?: string;
  roomType?: RoomType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  verifiedOnly?: boolean;
  /** backend expects a comma-separated list; a listing must have ALL of them */
  amenityIds?: number[];
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export interface RoomSearchResult {
  rooms: RoomCardItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function buildSearchQuery(params: SearchParams) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      qs.set(key, value.join(','));
    } else {
      qs.set(key, String(value));
    }
  }
  return qs.toString();
}

export function fetchRooms(params: SearchParams) {
  return apiRequest<RoomSearchResult>(`/rooms?${buildSearchQuery(params)}`);
}
