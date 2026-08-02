import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { RoomCard } from '@/components/rooms/room-card';
import type { RoomSearchResult } from '@/features/rooms/api';

// "Nổi bật" has no curation flag of its own — verified-first is already the
// backend's default ranking, so the highest-priced verified listings stand in
// as the featured set without inventing new state.
async function getFeatured() {
  return serverFetch<RoomSearchResult>('/rooms?sort=price_desc&pageSize=3', {
    revalidate: 3600,
  }).catch(() => null);
}

export async function FeaturedSection() {
  const data = await getFeatured();
  const rooms = data?.rooms ?? [];
  if (!rooms.length) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tin đăng nổi bật</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Những không gian sống nổi bật từ chủ trọ đã xác minh.
          </p>
        </div>
        <Link
          href="/?all=true"
          className="rounded-md text-sm font-medium text-brand-700 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room, index) => (
          <RoomCard key={room.id} room={room} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
