'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogBody, DialogContent } from '@/components/ui/dialog';
import type { RoomImage } from '@/features/rooms/api';

const PLACEHOLDER_IMAGE = 'https://placehold.co/800x600?text=Tro+Oi';

export function RoomGallery({
  title,
  images,
  isVerified = false,
}: {
  title: string;
  images: RoomImage[];
  isVerified?: boolean;
}) {
  const ordered = [...images].sort((a, b) => a.position - b.position);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (ordered.length === 0) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100">
        <Image
          src={PLACEHOLDER_IMAGE}
          alt={title}
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover"
        />
      </div>
    );
  }

  // Fewer than 5 photos doesn't fill the bento grid without stretching or
  // repeating tiles — the plain carousel already handles 1..N cleanly.
  if (ordered.length < 5) {
    return <CarouselGallery title={title} images={ordered} />;
  }

  const [main, ...rest] = ordered;
  const tiles = rest.slice(0, 4);

  return (
    <>
      <div className="md:hidden">
        <CarouselGallery title={title} images={ordered} />
      </div>

      <div className="hidden h-room-gallery grid-cols-8 grid-rows-2 gap-3 overflow-hidden rounded-lg md:grid">
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`Xem ảnh 1/${ordered.length}`}
          className="group relative col-span-6 row-span-2 overflow-hidden bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Image
            src={main.url}
            alt=""
            fill
            sizes="(max-width: 1152px) 75vw, 864px"
            quality={60}
            className="object-cover opacity-25 blur-xl"
            aria-hidden
          />
          <Image
            src={main.url}
            alt={title}
            fill
            sizes="(max-width: 1152px) 75vw, 864px"
            quality={90}
            priority
            className="object-contain"
          />
          <div className="absolute bottom-3 left-3 flex gap-2">
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Đã xác minh
              </span>
            )}
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900">
              1/{ordered.length} ảnh
            </span>
          </div>
        </button>

        {tiles.map((image, i) => {
          const isLast = i === tiles.length - 1;
          const remaining = ordered.length - 5;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => openAt(i + 1)}
              aria-label={`Xem ảnh ${i + 2}/${ordered.length}`}
              className="group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="(max-width: 1152px) 25vw, 288px"
                className="object-cover"
              />
              {isLast && remaining > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                  Xem tất cả {ordered.length} ảnh
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl">
          <DialogBody className="p-0">
            <CarouselGallery
              title={title}
              images={ordered}
              startIndex={lightboxIndex}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CarouselGallery({
  title,
  images,
  startIndex = 0,
}: {
  title: string;
  images: RoomImage[];
  startIndex?: number;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex });
  const [selected, setSelected] = useState(startIndex);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((image, i) => (
            <div
              key={image.id}
              className="relative aspect-video min-w-0 flex-[0_0_100%] bg-zinc-100"
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover opacity-25 blur-xl"
                aria-hidden
              />
              <Image
                src={image.url}
                alt={`${title} — ảnh ${i + 1}/${images.length}`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Ảnh trước"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Ảnh sau"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
            {selected + 1} / {images.length}
          </span>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={selected === i}
                className={cn(
                  'relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                  selected === i ? 'border-brand-600' : 'border-transparent',
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
