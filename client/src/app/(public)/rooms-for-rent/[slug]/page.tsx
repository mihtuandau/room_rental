import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomGrid } from '@/components/rooms/room-card';
import { buildSearchQuery, type RoomSearchResult } from '@/features/rooms/api';
import { PAGE_SIZE } from '@/features/rooms/search-params';
import { AREA_LANDINGS, findAreaLanding } from '@/lib/constants';
import { buildAreaMetadata } from '@/lib/seo/area-landing';
import { serverFetch } from '@/lib/server-api';
import { AreaPagination } from './_components/area-pagination';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const area = findAreaLanding((await params).slug);
  if (!area) return {};

  const page = Math.max(1, Number((await searchParams).page) || 1);
  return buildAreaMetadata(area, page);
}

export default async function AreaLandingPage({ params, searchParams }: Props) {
  const area = findAreaLanding((await params).slug);
  if (!area) notFound();

  const page = Math.max(1, Number((await searchParams).page) || 1);
  const query = buildSearchQuery({
    city: area.city,
    district: area.district,
    sort: 'newest',
    page,
    pageSize: PAGE_SIZE,
  });
  const data = await serverFetch<RoomSearchResult>(`/rooms?${query}`, {
    revalidate: 60,
  }).catch(() => null);

  // The full interactive search (price/area/amenities/map) — this landing
  // page itself stays a simple, fast-indexing list for the "quận X" keyword.
  // Only `city` carries over: the interactive search's location refinement is
  // ward-based (phường/xã), a different vocabulary than this page's district.
  const exploreHref = `/?city=${encodeURIComponent(area.city)}&all=true`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* A plain Link, not the client BackButton — this page is often an entry
          point (Google, the footer), so there may be no in-app history to
          go back to. */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tất cả tin đăng
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Phòng trọ {area.label}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Danh sách phòng trọ, nhà nguyên căn và chung cư mini tại {area.label}. Mọi tin
        đăng đều qua kiểm duyệt trước khi hiển thị.
      </p>

      <div className="mt-6">
        {!data ? (
          <ErrorState />
        ) : data.rooms.length === 0 ? (
          <EmptyState
            title="Chưa có tin đăng nào tại khu vực này"
            description="Thử xem tất cả tin đăng hoặc mở rộng khu vực tìm kiếm."
            action={{ label: 'Xem tất cả tin đăng', href: '/' }}
          />
        ) : (
          <>
            <p className="text-sm text-zinc-600">
              {data.total.toLocaleString('vi-VN')} tin đăng
            </p>
            <div className="mt-4">
              <RoomGrid rooms={data.rooms} className="sm:grid-cols-2 lg:grid-cols-3" />
            </div>
            <AreaPagination slug={area.slug} page={data.page} total={data.total} />
          </>
        )}
      </div>

      <div className="mt-10 flex justify-center border-t border-zinc-200 pt-6">
        <Button variant="outline" asChild>
          <Link href={exploreHref}>Mở bộ lọc nâng cao</Link>
        </Button>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return AREA_LANDINGS.map((a) => ({ slug: a.slug }));
}
