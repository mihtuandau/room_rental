'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoomCard, type RoomCardItem } from '@/components/rooms/room-card';

export function LatestListingsCarousel({ rooms }: { rooms: RoomCardItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Embla's own 'init' event fires during construction, before this effect
    // can subscribe to it — so the only way to read the real initial
    // scroll-state (unlike room-gallery.tsx's selected-index, there is no
    // static default that's correct here) is one synchronous call on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="min-w-0 flex-[0_0_78%] pl-4 sm:flex-[0_0_45%] lg:flex-[0_0_23%]"
            >
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      </div>

      {(canPrev || canNext) && (
        <div className="mt-4 hidden justify-end gap-2 sm:flex">
          <CarouselButton
            direction="prev"
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
          />
          <CarouselButton
            direction="next"
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
          />
        </div>
      )}
    </div>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Xem tin trước' : 'Xem tin tiếp theo'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors',
        'hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
