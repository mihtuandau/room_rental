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
import { ScrollReveal } from '@/components/ui/scroll-reveal';

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
 * Category Section: Clearly clickable category card buttons with circular icon badges,
 * distinct white card boundaries, and count pill tags for 100% affordance.
 */
export async function CategorySection() {
  const categories = await Promise.all(
    ROOM_TYPE_OPTIONS.map(async (option) => ({
      ...option,
      data: await getCategorySummary(option.value),
    })),
  );

  // Sort by total desc so the most-stocked category leads
  const sorted = [...categories].sort(
    (a, b) => (b.data?.total ?? 0) - (a.data?.total ?? 0),
  );

  return (
    <section id="kham-pha" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-6">
      <ScrollReveal className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Bạn muốn ở kiểu <span className="text-brand-700">phòng nào?</span>
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
            Chọn nhanh loại hình phù hợp với nhu cầu của bạn.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {sorted.map(({ value, label, data }, i) => {
          const total = data?.total ?? 0;
          const Icon = CATEGORY_ICONS[value];
          return (
            <ScrollReveal key={value} delay={i * 100}>
              <Link
                href={`/?roomType=${value}&all=true`}
                aria-label={`${label} — ${total} tin đăng`}
                className="group flex h-full flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 cursor-pointer"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-transform duration-200 group-hover:scale-110 group-hover:bg-brand-100">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold text-zinc-900 transition-colors duration-150 group-hover:text-brand-700">
                  {label}
                </p>
                <span className="mt-1.5 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 transition-colors duration-150 group-hover:bg-brand-50 group-hover:text-brand-700">
                  {total.toLocaleString('vi-VN')} tin đăng
                </span>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
