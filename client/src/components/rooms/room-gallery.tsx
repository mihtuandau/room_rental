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
        <DialogContent 
          overlayClassName="backdrop-blur-xl bg-zinc-100/50"
          className="max-w-none w-screen h-screen max-h-screen rounded-none bg-transparent border-none p-0 flex flex-col justify-center [&_button[aria-label=Đóng]]:top-6 [&_button[aria-label=Đóng]]:right-6 [&_button[aria-label=Đóng]]:h-12 [&_button[aria-label=Đóng]]:w-12 [&_button[aria-label=Đóng]]:rounded-full [&_button[aria-label=Đóng]]:bg-white/90 [&_button[aria-label=Đóng]]:shadow-lg [&_button[aria-label=Đóng]]:border [&_button[aria-label=Đóng]]:border-zinc-200/50 [&_button[aria-label=Đóng]]:flex [&_button[aria-label=Đóng]]:items-center [&_button[aria-label=Đóng]]:justify-center [&_button[aria-label=Đóng]]:text-zinc-700 [&_button[aria-label=Đóng]]:hover:bg-zinc-50 [&_button[aria-label=Đóng]]:transition-all [&_button[aria-label=Đóng]]:hover:scale-105"
        >
          <DialogBody className="p-0 flex-1 flex flex-col justify-center overflow-hidden">
            <CarouselGallery
              title={title}
              images={ordered}
              startIndex={lightboxIndex}
              isVerified={isVerified}
              isLightbox
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
  isLightbox = false,
  onImageClick,
}: {
  title: string;
  images: RoomImage[];
  startIndex?: number;
  isVerified?: boolean;
  showTitle?: boolean;
  isLightbox?: boolean;
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
    <div className={cn(
      "relative mx-auto w-full",
      isLightbox ? "max-w-none h-full flex flex-col justify-between" : "mt-4 max-w-5xl rounded-xl"
    )}>
      {showTitle && (
        <div className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 border-b",
          isLightbox ? "bg-zinc-900 border-zinc-800 text-white" : "rounded-t-xl border-zinc-100 bg-white"
        )}>
          <h3 className={cn("min-w-0 flex-1 truncate text-sm font-semibold", isLightbox ? "text-white" : "text-zinc-900")}>{title}</h3>
          {isVerified && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Đã xác minh
            </span>
          )}
        </div>
      )}

      <div className={cn(
        "mx-auto overflow-hidden",
        isLightbox ? "w-full flex-1 flex items-center bg-transparent" : "rounded-xl border border-zinc-200 bg-zinc-100"
      )} ref={emblaRef}>
        <div className={cn("flex w-full", isLightbox && "h-full items-center")}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onImageClick?.(index)}
              disabled={isLightbox}
              aria-label={`Mở ảnh ${index + 1}/${images.length}`}
              className={cn(
                "group relative min-w-0 flex-[0_0_100%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset",
                isLightbox 
                  ? "h-[65vh] sm:h-[70vh] lg:h-[75vh] bg-transparent" 
                  : "h-[min(52vh,360px)] bg-zinc-100 sm:h-[min(60vh,480px)] lg:h-[min(62vh,560px)]"
              )}
            >
              <Image
                src={image.url}
                alt={`${title} — ảnh ${index + 1}/${images.length}`}
                fill
                sizes={isLightbox ? "100vw" : "(max-width: 768px) 100vw, 768px"}
                quality={95}
                priority={index === 0}
                className={cn(
                  "object-contain transition-transform duration-300 group-hover:scale-[1.01]",
                  isLightbox && "drop-shadow-2xl"
                )}
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
            className={cn(
              "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
              isLightbox 
                ? "left-6 h-12 w-12 bg-white/90 shadow-lg border border-zinc-200/50 hover:bg-zinc-50 text-zinc-700 hover:scale-105 active:scale-95" 
                : "left-2 h-8 w-8 bg-white/90 shadow-md border border-zinc-200/50 hover:bg-zinc-50 text-zinc-700 active:scale-95"
            )}
          >
            <ChevronLeft className={isLightbox ? "h-6 w-6" : "h-4 w-4"} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Ảnh sau"
            className={cn(
              "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
              isLightbox 
                ? "right-6 h-12 w-12 bg-white/90 shadow-lg border border-zinc-200/50 hover:bg-zinc-50 text-zinc-700 hover:scale-105 active:scale-95" 
                : "right-2 h-8 w-8 bg-white/90 shadow-md border border-zinc-200/50 hover:bg-zinc-50 text-zinc-700 active:scale-95"
            )}
          >
            <ChevronRight className={isLightbox ? "h-6 w-6" : "h-4 w-4"} aria-hidden />
          </button>

          <span className={cn(
            "absolute rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums",
            isLightbox 
              ? "bottom-32 left-1/2 -translate-x-1/2 bg-white/90 text-zinc-800 shadow-md border border-zinc-200/50" 
              : "bottom-14 left-1/2 -translate-x-1/2 bg-black/75 text-white"
          )}>
            {selected + 1}/{images.length}
          </span>

          <div className={cn(
            "flex justify-center gap-1.5 overflow-x-auto px-1 pb-1",
            isLightbox 
              ? "mx-auto mb-8 bg-white/80 backdrop-blur-md border border-zinc-200/80 p-2 rounded-2xl shadow-xl max-w-[90vw] md:max-w-xl justify-center scrollbar-none" 
              : "mt-2"
          )}>
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={selected === index}
                className={cn(
                  'relative h-9 w-9 shrink-0 overflow-hidden rounded-md border-2 bg-zinc-200 transition-colors sm:h-10 sm:w-10',
                  selected === index 
                    ? (isLightbox ? 'border-brand-600' : 'border-zinc-700') 
                    : 'border-transparent',
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
