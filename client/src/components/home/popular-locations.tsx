'use client';

import Image from 'next/image';
import { useQueryStates } from 'nuqs';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { searchParsers } from '@/features/rooms/search-params';
import { PLACEHOLDER_IMAGE } from '@/components/rooms/room-card';
import { formatPrice } from '@/lib/utils';

export interface FeaturedLocation {
  city: string;
  district: string | null;
  count: number;
  minPrice: number | null;
  imageUrl: string | null;
}

export function PopularLocations({ locations = [] }: { locations?: FeaturedLocation[] }) {
  const [, setQuery] = useQueryStates(searchParsers);

  const handleLocationClick = (location: FeaturedLocation) => {
    void setQuery({
      city: location.city,
      district: location.district ?? '',
      all: true,
      page: 1,
    }).then(() => {
      // Smooth scroll to the results view toolbar
      const el = document.getElementById('search-results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  return (
    <section
      id="kham-pha"
      className="mx-auto w-full max-w-7xl scroll-mt-28 px-4 sm:px-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Khu vực có nhiều tin
        </h2>
        <p className="max-w-2xl text-sm text-zinc-500">
          Chọn nhanh nơi có nhiều tin đăng đang hoạt động, kèm mức giá tham khảo để dễ bắt đầu tìm kiếm.
        </p>
      </div>

      {locations.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {locations.map((loc, index) => {
            const areaName = loc.district ?? loc.city;
            const summary = loc.minPrice
              ? `${loc.city} · Từ ${formatPrice(loc.minPrice)}/tháng`
              : `${loc.city} · Tin đang hoạt động`;
          return (
            <button
              key={`${loc.city}-${areaName}`}
              type="button"
              onClick={() => handleLocationClick(loc)}
              className="group relative h-40 w-full overflow-hidden rounded-xl border border-zinc-200 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 sm:h-56"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={loc.imageUrl ?? PLACEHOLDER_IMAGE}
                  alt={`Phòng trọ tại ${areaName}, ${loc.city}`}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 25vw"
                />
                {/* A restrained overlay keeps text readable without making the card feel glossy. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/75" />
              </div>

              {/* Tag Badge / Real Count */}
              <div className="absolute left-4 top-4 z-10 rounded-md bg-black/45 px-3 py-1 text-xs font-medium text-white">
                {loc.count} tin đăng
              </div>

              {/* Content Bottom */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between text-white">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-brand-400 shrink-0" aria-hidden />
                    <span className="text-lg font-semibold tracking-tight">{areaName}</span>
                  </div>
                  <p className="text-xs text-zinc-200/90 line-clamp-2 leading-relaxed font-medium">
                    {summary}
                  </p>
                </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white transition-colors duration-200 group-hover:border-brand-500 group-hover:bg-brand-600">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </div>
            </div>
          </button>
          );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center text-sm text-zinc-500">
          Chưa có khu vực nào có tin đăng đang hiển thị.
        </div>
      )}
    </section>
  );
}
