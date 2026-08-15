import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createLoader } from 'nuqs/server';
import { CategoryBar } from '@/components/home/category-bar';
import { FeaturedSection } from '@/components/home/featured-section';
import { HomeHero } from '@/components/home/home-hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { LandlordCta } from '@/components/home/landlord-cta';
import {
  PopularLocations,
  type FeaturedLocation,
} from '@/components/home/popular-locations';
import { SearchView } from '@/components/search/search-view';
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

type PublicSearchParams = Record<
  string,
  string | string[] | undefined
>;
type Props = { searchParams: Promise<PublicSearchParams> };

const loadSearchParams = createLoader(searchParsers);

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
  const location = [parsed.ward, parsed.district, parsed.city]
    .filter(Boolean)
    .join(', ');
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
  const roomQueryKey = roomKeys.search(filters);
  const roomsPromise = queryClient.prefetchQuery({
    queryKey: roomQueryKey,
    queryFn: () =>
      serverFetch<RoomSearchResult>(
        `/rooms?${buildSearchQuery(filters)}`,
        { revalidate: 60 },
      ),
  });

  const locationsPromise = serverFetch<FeaturedLocation[]>(
    '/rooms/featured-locations?limit=4',
    { next: { revalidate: 60 } },
  ).catch(() => []);

  const [locations, , amenities, provinces] = await Promise.all([
    locationsPromise,
    roomsPromise,
    serverFetch<Amenity[]>('/amenities', { revalidate: 3600 }).catch(
      () => [],
    ),
    fetchProvinces(),
  ]);

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomeHero
          provinces={provinces}
        />
        {!isSearchExpanded(parsed) ? <CategoryBar /> : null}
        <SearchView
          amenities={amenities}
          provinces={provinces}
          browseTop={
            <div className="flex flex-col gap-12 sm:gap-16">
              <FeaturedSection />
              <PopularLocations locations={locations} />
              <HowItWorks />
            </div>
          }
          browseBottom={
            <div className="pt-4 sm:pt-6">
              <LandlordCta />
            </div>
          }
        />
      </HydrationBoundary>
    </>
  );
}
