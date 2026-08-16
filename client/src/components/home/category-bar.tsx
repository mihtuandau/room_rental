'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import {
  ROOM_TYPE_OPTIONS,
  type RoomType,
} from '@/lib/constants';
import { isSearchExpanded, searchParsers } from '@/features/rooms/search-params';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const CATEGORY_IMAGES: Record<RoomType, string> = {
  boarding_house: '/phong_tro.png',
  whole_house: '/nha_nguyen_can.png',
  mini_apartment: '/chung_cu_mini.png',
  serviced_apartment: '/can_ho_dich_vu.png',
  shared_room: '/o_ghep.png',
};

export function CategoryBar() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [state, setState] = useQueryStates(searchParsers, {
    history: 'push',
    // Selecting a category is a full search transition, so let the server
    // replace the landing layout with the results layout immediately.
    shallow: false,
  });
  const handleCategoryClick = (value: RoomType) => {
    if (state.roomType === value) {
      // Toggle off if already selected
      void setState({ roomType: null, page: 1 });
    } else {
      // Remove the landing section before starting the results transition so
      // the category cards never flash above the search results.
      setIsNavigating(true);
      window.scrollTo({ top: 0, behavior: 'auto' });
      void setState({ roomType: value, all: true, page: 1 });
    }
  };

  if (isNavigating || isSearchExpanded(state)) return null;

  return (
    <section
      aria-labelledby="category-heading"
      className="relative z-20 mt-6 w-full bg-surface-card py-8 scroll-mt-20 sm:mt-8 sm:py-10"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-6">
          <div>
            <h2 id="category-heading" className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Tìm theo <span className="text-brand-700">loại phòng</span>
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
              Chọn không gian phù hợp với nhu cầu của bạn.
            </p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          {ROOM_TYPE_OPTIONS.map(({ value, label }, index) => {
            const isActive = state.roomType === value;
            return (
              <ScrollReveal
                key={value}
                delay={index * 70}
                className="w-44 shrink-0 sm:w-auto"
              >
                <button
                  type="button"
                  onClick={() => handleCategoryClick(value)}
                  aria-pressed={isActive}
                  className={cn(
                    'group relative h-32 w-full cursor-pointer overflow-hidden rounded-xl border border-border-subtle text-left transition-[transform,box-shadow,ring] duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:h-36',
                    isActive
                      ? 'ring-2 ring-brand-600 ring-offset-2'
                      : 'bg-surface-card',
                  )}
                >
                  <Image
                    src={CATEGORY_IMAGES[value]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, 176px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/10 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 font-heading text-base font-semibold text-white">
                    {label}
                  </span>
                  {isActive ? (
                    <span className="absolute right-2 top-2 rounded-full bg-brand-600 px-2 py-1 text-xs font-medium text-white">
                      Đang chọn
                    </span>
                  ) : null}
                </button>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
