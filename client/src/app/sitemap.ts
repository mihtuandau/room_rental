import type { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/server-api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
const PAGE_SIZE = 100;

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

  const pages = Math.ceil(first.total / PAGE_SIZE);
  if (pages <= 1) return first.rooms;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      serverFetch<RoomsPage>(`/rooms?page=${index + 2}&pageSize=${PAGE_SIZE}`, {
        revalidate: 3600,
      }),
    ),
  );
  return [...first.rooms, ...rest.flatMap((page) => page.rooms)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rooms = await getActiveRooms();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...rooms.map((room) => ({
      url: `${SITE_URL}/room/${room.slug}`,
      lastModified: new Date(room.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
