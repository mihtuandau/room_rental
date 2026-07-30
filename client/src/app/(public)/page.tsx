import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createLoader } from 'nuqs/server';
import { makeQueryClient } from '@/lib/query-client';
import { serverFetch } from '@/lib/server-api';
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
import { HomeHero } from '@/components/home/home-hero';
import { CategorySection } from '@/components/home/category-section';
import { FeaturedSection } from '@/components/home/featured-section';
import { LandlordCta } from '@/components/home/landlord-cta';
import { SearchView } from '@/components/search/search-view';

// Home IS the search page: hero on top, filters + results below. Filter state
// lives in the home URL (?roomType=…) so results stay shareable and indexable.
const loadSearchParams = createLoader(searchParsers);

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const parsed = await loadSearchParams(await searchParams);
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

export default async function HomePage({ searchParams }: Props) {
  const parsed = await loadSearchParams(await searchParams);
  const filters = toSearchParams(parsed);

  const queryClient = makeQueryClient();
  // prefetchQuery never throws — a backend outage stores an error and the client
  // hook takes over with the retryable error state.
  await queryClient.prefetchQuery({
    queryKey: roomKeys.search(filters),
    queryFn: () =>
      serverFetch<RoomSearchResult>(`/rooms?${buildSearchQuery(filters)}`, {
        revalidate: 60,
      }),
  });

  const [amenities, provinces] = await Promise.all([
    serverFetch<Amenity[]>('/amenities', { revalidate: 3600 }).catch(() => []),
    fetchProvinces(),
  ]);

  return (
    <>
      <HomeHero provinces={provinces} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SearchView
          amenities={amenities}
          provinces={provinces}
          browseTop={
            <>
              <CategorySection />
              <FeaturedSection />
            </>
          }
          browseBottom={<LandlordCta />}
        />
      </HydrationBoundary>
    </>
  );
}
