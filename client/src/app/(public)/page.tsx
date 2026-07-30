import type { Metadata } from 'next';
import { HydrationBoundary } from '@tanstack/react-query';
import { CategorySection } from '@/components/home/category-section';
import { FeaturedSection } from '@/components/home/featured-section';
import { HomeHero } from '@/components/home/home-hero';
import { LandlordCta } from '@/components/home/landlord-cta';
import { SearchView } from '@/components/search/search-view';
import {
  buildHomeMetadata,
  prepareHomePage,
  type PublicSearchParams,
} from './_lib/home-page';

type Props = { searchParams: Promise<PublicSearchParams> };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  return buildHomeMetadata(await searchParams);
}

export default async function HomePage({ searchParams }: Props) {
  const { dehydratedState, amenities, provinces } = await prepareHomePage(
    await searchParams,
  );

  return (
    <>
      <HomeHero provinces={provinces} />
      <HydrationBoundary state={dehydratedState}>
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
