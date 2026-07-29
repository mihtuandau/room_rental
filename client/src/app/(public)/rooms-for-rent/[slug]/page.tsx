import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomGrid } from '@/components/rooms/room-card';
import { AREA_LANDINGS, findAreaLanding } from '@/lib/constants';
import { buildSearchQuery, type RoomSearchResult } from '@/features/rooms/api';
import { PAGE_SIZE } from '@/features/rooms/search-params';
import { serverFetch } from '@/lib/server-api';
import { cn } from '@/lib/utils';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = findAreaLanding((await params).slug);
  if (!area) return {};

  const title = `Phòng trọ ${area.label} — tin đã xác minh`;
  return {
    title,
    description: `Tìm phòng trọ, nhà nguyên căn, chung cư mini tại ${area.label}. Mọi tin đăng đều qua kiểm duyệt trước khi hiển thị, cập nhật mỗi ngày.`,
    alternates: { canonical: `/rooms-for-rent/${area.slug}` },
    openGraph: { title, type: 'website' },
  };
}

export default async function AreaLandingPage({ params, searchParams }: Props) {
  const area = findAreaLanding((await params).slug);
  if (!area) notFound();

  const page = Math.max(1, Number((await searchParams).page) || 1);
  const filters = {
    city: area.city,
    district: area.district,
    sort: 'newest' as const,
    page,
    pageSize: PAGE_SIZE,
  };

  const data = await serverFetch<RoomSearchResult>(
    `/rooms?${buildSearchQuery(filters)}`,
    { revalidate: 60 },
  ).catch(() => null);

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

/** Plain Link-based pager (no client state needed — page is a query param). */
function AreaPagination({
  slug,
  page,
  total,
}: {
  slug: string;
  page: number;
  total: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const visible = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav
      aria-label="Phân trang"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      {visible.map((p, i) => {
        const prev = visible[i - 1];
        const gap = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-sm text-zinc-400">…</span>}
            <Link
              href={`/rooms-for-rent/${slug}${p > 1 ? `?page=${p}` : ''}`}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                p === page
                  ? 'border-brand-600 bg-brand-600 font-medium text-white'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50',
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}

export function generateStaticParams() {
  return AREA_LANDINGS.map((a) => ({ slug: a.slug }));
}
