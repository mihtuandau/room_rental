import type { Metadata } from 'next';
import { dehydrate } from '@tanstack/react-query';
import { createLoader } from 'nuqs/server';
import type { Amenity } from '@/features/amenities/api';
import { fetchProvinces } from '@/features/locations/api';
import { buildSearchQuery, type RoomSearchResult } from '@/features/rooms/api';
import { roomKeys } from '@/features/rooms/hooks';
import {
  isSearchExpanded,
  searchParsers,
  toSearchParams,
} from '@/features/rooms/search-params';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { makeQueryClient } from '@/lib/query-client';
import { serverFetch } from '@/lib/server-api';

export type PublicSearchParams = Record<
  string,
  string | string[] | undefined
>;

const loadSearchParams = createLoader(searchParsers);

export async function buildHomeMetadata(
  searchParams: PublicSearchParams,
): Promise<Metadata> {
  const parsed = await loadSearchParams(searchParams);
  const hasSearchState =
    isSearchExpanded(parsed) ||
    parsed.page > 1 ||
    parsed.sort !== 'newest';
  const roomType = parsed.roomType
    ? ROOM_TYPE_LABELS[parsed.roomType]
    : 'Phòng cho thuê';
  const location = parsed.ward || parsed.city;
  const title = hasSearchState
    ? `${roomType}${location ? ` tại ${location}` : ''} — kết quả tìm kiếm`
    : 'Tìm phòng trọ, nhà nguyên căn đã xác minh';
  const description = hasSearchState
    ? `Khám phá ${roomType.toLocaleLowerCase('vi-VN')}${location ? ` tại ${location}` : ''} trên Trọ Ơi. Lọc theo giá, diện tích và tiện ích để tìm nơi ở phù hợp.`
    : 'Tìm phòng trọ, nhà nguyên căn và chung cư mini trên Trọ Ơi. Tin đăng được kiểm duyệt, thông tin rõ ràng và cập nhật mỗi ngày.';

  return {
    title,
    description,
    alternates: { canonical: '/' },
    robots: hasSearchState
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'vi_VN',
      siteName: 'Trọ Ơi',
      url: '/',
      images: [
        {
          url: '/banner.png',
          alt: 'Trọ Ơi — tìm phòng trọ đã xác minh',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/banner.png'],
    },
  };
}

export async function prepareHomePage(searchParams: PublicSearchParams) {
  const parsed = await loadSearchParams(searchParams);
  const filters = toSearchParams(parsed);
  const queryClient = makeQueryClient();
  const roomsPromise = queryClient.prefetchQuery({
    queryKey: roomKeys.search(filters),
    queryFn: () =>
      serverFetch<RoomSearchResult>(
        `/rooms?${buildSearchQuery(filters)}`,
        { revalidate: 60 },
      ),
  });

  const [, amenities, provinces] = await Promise.all([
    roomsPromise,
    serverFetch<Amenity[]>('/amenities', { revalidate: 3600 }).catch(
      () => [],
    ),
    fetchProvinces(),
  ]);

  return {
    dehydratedState: dehydrate(queryClient),
    amenities,
    provinces,
  };
}
