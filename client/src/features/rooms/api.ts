import { apiRequest } from '@/lib/api-client';
import type { AmenityType, RoomStatus, RoomType } from '@/lib/constants';
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
  createdAt: string;
  /** Masked contact returned by the public detail endpoint. */
  contactPhoneMasked: string | null;
  contactPhoneVerified: boolean;
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
  createdAt: string;
  updatedAt: string;
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
  ward?: string;
  roomType?: RoomType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  lat?: string;
  lng?: string;
  radiusKm?: number;
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

export function recordRoomView(roomId: number, visitorId: string) {
  return apiRequest<{ recorded: boolean }>(`/rooms/${roomId}/view`, {
    method: 'POST',
    body: JSON.stringify({ visitorId }),
  });
}

/** Mirrors the backend's CreateRoomDto. */
export interface CreateRoomInput {
  title: string;
  description?: string;
  roomType: RoomType;
  price: number;
  area?: number;
  deposit?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxOccupants?: number;
  city: string;
  district: string;
  ward?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreatedRoom {
  id: number;
  slug: string;
}

export function createRoom(input: CreateRoomInput) {
  return apiRequest<CreatedRoom>('/rooms', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** One of the current user's own listings, any status — GET /rooms/mine. */
export interface MyRoomItem {
  id: number;
  title: string;
  slug: string;
  status: RoomStatus;
  roomType: RoomType;
  price: number;
  city: string;
  district: string;
  createdAt: string;
  /** Set the moment admin approval flips status to 'active'; null otherwise. */
  publishedAt: string | null;
  /** Set only by an admin (see admin-rooms.service.ts's setVerified) — landlords can't self-verify. */
  isVerified: boolean;
  viewCount: number;
  contactCount: number;
  images: { url: string }[];
}

export function fetchMyRooms() {
  return apiRequest<MyRoomItem[]>('/rooms/mine');
}

/** Replaces the listing's full amenity set. */
export function setRoomAmenities(roomId: number, amenityIds: number[]) {
  return apiRequest<{ success: boolean }>(`/rooms/${roomId}/amenities`, {
    method: 'PUT',
    body: JSON.stringify({ amenityIds }),
  });
}

/** Persists an image after it's been uploaded directly to Cloudinary (see upload-image-cloudinary skill). */
export function confirmRoomImage(
  roomId: number,
  image: { public_id: string; secure_url: string },
  isCover = false,
) {
  return apiRequest<RoomImage>(`/rooms/${roomId}/images/confirm`, {
    method: 'POST',
    body: JSON.stringify({ key: image.public_id, isCover }),
  });
}

export function deleteRoomImage(roomId: number, imageId: string) {
  return apiRequest<{ success: boolean }>(`/rooms/${roomId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

export function setRoomCoverImage(roomId: number, imageId: string) {
  return apiRequest<RoomImage>(`/rooms/${roomId}/images/${imageId}/cover`, {
    method: 'PATCH',
  });
}

/** Full detail of one of the caller's own listings, any status — GET /rooms/mine/:id, powers the edit form. */
export interface MyRoomDetail {
  id: number;
  title: string;
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
  status: RoomStatus;
  updatedAt: string;
  images: RoomImage[];
  amenities: RoomAmenity[];
}

export function fetchMyRoomDetail(id: number) {
  return apiRequest<MyRoomDetail>(`/rooms/mine/${id}`);
}

/** Mirrors the backend's UpdateRoomDto — every field of CreateRoomInput, all optional. */
export type UpdateRoomInput = Partial<CreateRoomInput>;

export function updateRoom(id: number, input: UpdateRoomInput) {
  return apiRequest<MyRoomDetail>(`/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteRoom(id: number) {
  // The backend returns the updated (soft-deleted) room, but callers only
  // care that the call succeeded.
  return apiRequest<unknown>(`/rooms/${id}`, { method: 'DELETE' });
}
