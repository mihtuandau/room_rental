'use client';

import Image from 'next/image';
import { useQueryStates } from 'nuqs';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { searchParsers } from '@/features/rooms/search-params';
import LOCATIONS from '@/config/popular-locations.json';

export interface LocationCount {
  district: string;
  count: number;
  minPrice?: number;
}

export function PopularLocations({ counts = [] }: { counts?: LocationCount[] }) {
  const [, setQuery] = useQueryStates(searchParsers);

  const handleLocationClick = (district: string) => {
    void setQuery({
      city: 'Hồ Chí Minh',
      district: district,
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
    <section id="kham-pha" className="scroll-mt-28 py-4 sm:py-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Khám phá khu vực nổi bật
        </h2>
        <p className="max-w-2xl text-sm text-zinc-500">
          Tìm nhanh phòng trọ, nhà nguyên căn, chung cư mini tại các quận trung tâm nhộn nhịp, gần các cụm trường đại học lớn.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LOCATIONS.map((loc) => {
          const locationData = counts.find((c) => c.district === loc.district);
          const activeCount = locationData?.count ?? 0;
          return (
            <button
              key={loc.district}
              type="button"
              onClick={() => handleLocationClick(loc.district)}
              className="group relative h-56 w-full overflow-hidden rounded-2xl border border-zinc-200 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 cursor-pointer"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={loc.image}
                  alt={`Phòng trọ tại ${loc.district}`}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 25vw"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 transition-colors duration-300 group-hover:from-black/90 group-hover:via-black/50" />
              </div>

              {/* Tag Badge / Real Count */}
              <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
                {activeCount > 0 ? `${activeCount} tin đăng` : loc.tag}
              </div>

              {/* Content Bottom */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between text-white">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-brand-400 shrink-0" aria-hidden />
                    <span className="text-lg font-bold tracking-tight">{loc.district}</span>
                  </div>
                  <p className="text-xs text-zinc-200/90 line-clamp-2 leading-relaxed font-medium">
                    {loc.subtext}
                  </p>
                </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 border border-white/20 backdrop-blur-xs text-white transition-all duration-300 group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:scale-110">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </div>
            </div>
          </button>
          );
        })}
      </div>
    </section>
  );
}
