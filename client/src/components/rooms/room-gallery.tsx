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
  const ordered = [...images].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (ordered.length === 0) {
    return (
      <div className="relative mx-auto mt-6 aspect-[3/2] w-full max-w-5xl overflow-hidden rounded-xl bg-zinc-100">
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

  return (
    <>
      <CarouselGallery
        title={title}
        images={ordered}
        isVerified={isVerified}
        onImageClick={(index) => {
          setLightboxIndex(index);
          setLightboxOpen(true);
        }}
      />
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl">
          <DialogBody className="p-0">
            <CarouselGallery
              title={title}
              images={ordered}
              startIndex={lightboxIndex}
              isVerified={isVerified}
              showTitle
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
  isVerified = false,
  showTitle = false,
  onImageClick,
}: {
  title: string;
  images: RoomImage[];
  startIndex?: number;
  isVerified?: boolean;
  showTitle?: boolean;
  onImageClick?: (index: number) => void;
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
    <div className="relative mx-auto mt-4 w-full max-w-5xl rounded-xl">
      {showTitle && (
        <div className="flex items-center justify-between gap-4 rounded-t-xl border-b border-zinc-100 bg-white px-4 py-3">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">{title}</h3>
          {isVerified && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Đã xác minh
            </span>
          )}
        </div>
      )}

      <div className="mx-auto overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onImageClick?.(index)}
              aria-label={`Mở ảnh ${index + 1}/${images.length}`}
              className="group relative h-[min(52vh,360px)] min-w-0 flex-[0_0_100%] bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset sm:h-[min(60vh,480px)] lg:h-[min(62vh,560px)]"
            >
              <Image
                src={image.url}
                alt={`${title} — ảnh ${index + 1}/${images.length}`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                quality={90}
                priority={index === 0}
                className="object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </button>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Ảnh trước"
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/90 text-white transition-colors hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Ảnh sau"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/90 text-white transition-colors hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>

          <span className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white">
            {selected + 1}/{images.length}
          </span>

          <div className="mt-2 flex justify-center gap-1.5 overflow-x-auto px-1 pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={selected === index}
                className={cn(
                  'relative h-9 w-9 shrink-0 overflow-hidden rounded-md border-2 bg-zinc-200 transition-colors sm:h-10 sm:w-10',
                  selected === index ? 'border-zinc-700' : 'border-transparent',
                )}
              >
                <Image src={image.url} alt="" fill sizes="40px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
