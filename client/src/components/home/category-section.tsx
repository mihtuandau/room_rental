import Link from 'next/link';
import { House } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { ROOM_TYPE_OPTIONS } from '@/lib/constants';
import type { RoomSearchResult } from '@/features/rooms/api';

async function getCategorySummary(roomType: string) {
  return serverFetch<RoomSearchResult>(
    `/rooms?roomType=${roomType}&pageSize=1`,
    { revalidate: 3600 },
  ).catch(() => null);
}

/**
 * Each tile's photo is the category's own real cover image (its most recent
 * active listing) — never stock photography — and its count is a live total
 * from the search endpoint, not a made-up number. A category with zero
 * listings falls back to a plain icon tile instead of a missing image.
 */
export async function CategorySection() {
  const categories = await Promise.all(
    ROOM_TYPE_OPTIONS.map(async (option) => ({
      ...option,
      data: await getCategorySummary(option.value),
    })),
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <h2 className="text-lg font-semibold">Khám phá theo danh mục</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map(({ value, label, data }) => {
          const cover = data?.rooms[0]?.images[0]?.url;
          const total = data?.total ?? 0;
          return (
            <Link
              key={value}
              href={`/?roomType=${value}`}
              className="group overflow-hidden rounded-lg border border-zinc-200 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- swap to next/image once remote hosts are configured
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300">
                    <House className="h-8 w-8" aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-zinc-500">
                  {total.toLocaleString('vi-VN')} tin đăng
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
