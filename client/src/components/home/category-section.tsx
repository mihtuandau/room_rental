import Image from 'next/image';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import {
  ROOM_TYPE_OPTIONS,
  type RoomType,
} from '@/lib/constants';
import type { RoomSearchResult } from '@/features/rooms/api';

const CATEGORY_IMAGES: Record<RoomType, string> = {
  boarding_house: '/phong_tro.png',
  whole_house: '/nha_nguyen_can.png',
  mini_apartment: '/chung_cu_mini.png',
  serviced_apartment: '/can_ho_dich_vu.png',
  shared_room: '/o_ghep.png',
};

async function getCategorySummary(roomType: string) {
  return serverFetch<RoomSearchResult>(
    `/rooms?roomType=${roomType}&pageSize=1`,
    { revalidate: 3600 },
  ).catch(() => null);
}

/**
 * Category artwork is curated in /public so every room type stays visually
 * consistent. Counts remain live data from the search endpoint.
 */
export async function CategorySection() {
  const categories = await Promise.all(
    ROOM_TYPE_OPTIONS.map(async (option) => ({
      ...option,
      data: await getCategorySummary(option.value),
    })),
  );

  return (
    <section
      id="kham-pha"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-6"
    >
      <h2 className="text-lg font-semibold">Khám phá theo danh mục</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map(({ value, label, data }) => {
          const total = data?.total ?? 0;
          return (
            <Link
              key={value}
              href={`/?roomType=${value}`}
              className="group overflow-hidden rounded-lg border border-zinc-200 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
                <Image
                  src={CATEGORY_IMAGES[value]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
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
