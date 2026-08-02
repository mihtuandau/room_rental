import type { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/server-api';
import { AREA_LANDINGS } from '@/lib/constants';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000'
).replace(/\/+$/, '');
const PAGE_SIZE = 50;
const PAGE_FETCH_CONCURRENCY = 5;
const MAX_SITEMAP_ROOMS = 49_000;

interface SitemapRoom {
  slug: string;
  updatedAt: string;
}

interface RoomsPage {
  rooms: SitemapRoom[];
  total: number;
}

async function getActiveRooms(): Promise<SitemapRoom[]> {
  const first = await serverFetch<RoomsPage>(
    `/rooms?page=1&pageSize=${PAGE_SIZE}`,
    { revalidate: 3600 },
  );

  const roomLimit = Math.min(first.total, MAX_SITEMAP_ROOMS);
  const pages = Math.ceil(roomLimit / PAGE_SIZE);
  if (pages <= 1) return first.rooms;

  const rooms = [...first.rooms];
  for (let firstPage = 2; firstPage <= pages; firstPage += PAGE_FETCH_CONCURRENCY) {
    const lastPage = Math.min(
      firstPage + PAGE_FETCH_CONCURRENCY - 1,
      pages,
    );
    const batch = await Promise.all(
      Array.from(
        { length: lastPage - firstPage + 1 },
        (_, index) =>
          serverFetch<RoomsPage>(
            `/rooms?page=${firstPage + index}&pageSize=${PAGE_SIZE}`,
            { revalidate: 3600 },
          ),
      ),
    );
    rooms.push(...batch.flatMap((page) => page.rooms));
  }
  return rooms.slice(0, roomLimit);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A frontend deploy must not fail just because the API is temporarily
  // unavailable during build. Static routes still ship, and room URLs return
  // on the next revalidation once the backend is reachable again.
  const rooms = await getActiveRooms().catch(() => []);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date('2026-07-30'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...AREA_LANDINGS.map((area) => ({
      url: `${SITE_URL}/rooms-for-rent/${area.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...rooms.map((room) => ({
      url: `${SITE_URL}/room/${room.slug}`,
      lastModified: new Date(room.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
