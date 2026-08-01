import Link from 'next/link';
import {
  BedDouble,
  Building2,
  House,
  Hotel,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import {
  ROOM_TYPE_OPTIONS,
  type RoomType,
} from '@/lib/constants';
import type { RoomSearchResult } from '@/features/rooms/api';

const CATEGORY_ICONS: Record<RoomType, LucideIcon> = {
  boarding_house: BedDouble,
  whole_house: House,
  mini_apartment: Building2,
  serviced_apartment: Hotel,
  shared_room: UsersRound,
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
      <div>
        <h2 className="text-lg font-semibold">Bạn muốn ở kiểu phòng nào?</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Chọn nhanh loại hình phù hợp với nhu cầu của bạn.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map(({ value, label, data }) => {
          const total = data?.total ?? 0;
          const Icon = CATEGORY_ICONS[value];
          return (
            <Link
              key={value}
              href={`/?roomType=${value}`}
              className="group flex min-h-32 flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-4 text-center transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium">{label}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {total.toLocaleString('vi-VN')} tin đăng
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
