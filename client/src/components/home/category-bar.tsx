'use client';

import { useQueryStates } from 'nuqs';
import {
  BedDouble,
  Building2,
  House,
  Hotel,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import {
  ROOM_TYPE_OPTIONS,
  type RoomType,
} from '@/lib/constants';
import { searchParsers } from '@/features/rooms/search-params';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<RoomType, LucideIcon> = {
  boarding_house: BedDouble,
  whole_house: House,
  mini_apartment: Building2,
  serviced_apartment: Hotel,
  shared_room: UsersRound,
};

export function CategoryBar() {
  const [state, setState] = useQueryStates(searchParsers, {
    history: 'push',
    shallow: true,
  });
  const handleCategoryClick = (value: RoomType) => {
    if (state.roomType === value) {
      // Toggle off if already selected
      void setState({ roomType: null, page: 1 });
    } else {
      // Select new category and expand search results
      void setState({ roomType: value, all: true, page: 1 });
    }
  };

  return (
    <div className="relative z-20 w-full border-b border-zinc-200/70 bg-white scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-start gap-6 overflow-x-auto py-2 scrollbar-none sm:gap-8">
          {ROOM_TYPE_OPTIONS.map(({ value, label }) => {
            const Icon = CATEGORY_ICONS[value];
            const isActive = state.roomType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleCategoryClick(value)}
                aria-pressed={isActive}
                className={cn(
                  'group flex min-h-10 flex-row items-center gap-1.5 border-b-2 py-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 cursor-pointer',
                  isActive
                    ? 'border-brand-600 text-brand-600 font-semibold'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform duration-200 group-hover:scale-105',
                    isActive ? 'text-brand-600' : 'text-zinc-400 group-hover:text-zinc-600',
                  )}
                  aria-hidden
                />
                <span className="text-xs font-medium tracking-tight whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
