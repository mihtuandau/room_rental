'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { Camera, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomImage } from '@/features/rooms/api';

const PLACEHOLDER_IMAGE = 'https://placehold.co/800x600?text=Tro+Oi';

export function RoomGallery({
  title,
  images,
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

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const thumbButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Auto-scroll the active thumbnail into view smoothly
  useEffect(() => {
    const activeBtn = thumbButtonRefs.current[selected];
    if (activeBtn && thumbnailsRef.current) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selected]);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (ordered.length === 0) {
    return (
      <div className="relative mx-auto h-[260px] sm:h-[360px] lg:h-[420px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
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
      <div className="relative mx-auto w-full select-none">
        {/* Main Slider Box */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-900 shadow-xs">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex w-full">
              {ordered.map((image, index) => (
                <div
                  key={image.id}
                  className="relative h-[260px] sm:h-[360px] lg:h-[420px] w-full flex-[0_0_100%] cursor-zoom-in bg-zinc-900"
                  onClick={() => handleOpenLightbox(index)}
                >
                  <Image
                    src={image.url}
                    alt={`${title} — ảnh ${index + 1}/${ordered.length}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    quality={90}
                    priority={index === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Counter badge & expand button */}
          <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-medium text-white shadow-card backdrop-blur-md">
              <Camera className="h-3.5 w-3.5 opacity-80" aria-hidden />
              <span className="tabular-nums font-semibold">{selected + 1}</span> / {ordered.length}
            </span>
            <button
              type="button"
              onClick={() => handleOpenLightbox(selected)}
              aria-label="Phóng to ảnh"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-white shadow-card backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <Expand className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Navigation Arrows */}
          {ordered.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollPrev();
                }}
                aria-label="Ảnh trước"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-card border border-zinc-200 hover:bg-white hover:scale-105 active:scale-90 transition-all backdrop-blur-xs"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollNext();
                }}
                aria-label="Ảnh sau"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-card border border-zinc-200 hover:bg-white hover:scale-105 active:scale-90 transition-all backdrop-blur-xs"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Row (smooth scroll, auto-centering active thumbnail) */}
        {ordered.length > 1 && (
          <div
            ref={thumbnailsRef}
            className="mt-3 flex gap-2.5 overflow-x-auto p-1 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {ordered.map((image, index) => (
              <button
                key={image.id}
                ref={(el) => {
                  thumbButtonRefs.current[index] = el;
                }}
                type="button"
                onClick={() => {
                  emblaApi?.scrollTo(index);
                  setSelected(index);
                }}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={selected === index}
                className={cn(
                  'relative h-13 w-18 sm:h-15 sm:w-22 shrink-0 snap-center overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer',
                  selected === index
                    ? 'border-brand-600 ring-2 ring-brand-600/30 scale-105 opacity-100 shadow-xs z-10'
                    : 'border-zinc-200 opacity-60 hover:opacity-100 hover:border-zinc-400',
                )}
              >
                <Image src={image.url} alt="" fill sizes="90px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Lightbox
          images={ordered}
          initialIndex={lightboxIndex}
          title={title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  initialIndex = 0,
  title,
  onClose,
}: {
  images: RoomImage[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const lightboxThumbsRef = useRef<HTMLDivElement>(null);
  const lightboxThumbBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [images.length, onClose]);

  // Auto-scroll active thumbnail inside Lightbox
  useEffect(() => {
    const activeBtn = lightboxThumbBtnRefs.current[currentIndex];
    if (activeBtn && lightboxThumbsRef.current) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

  if (images.length === 0 || typeof document === 'undefined') return null;

  const currentImage = images[currentIndex] || images[0];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh toàn màn hình"
      className="fixed inset-0 z-[99999] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top bar: Counter & Close */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="hidden sm:inline-block text-xs text-zinc-400 truncate max-w-md">
            {title}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Area */}
      <div
        className="relative flex-1 flex items-center justify-center px-4 sm:px-16 overflow-hidden min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            aria-label="Ảnh trước"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/20 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Current Image */}
        <div className="relative flex items-center justify-center max-h-[75vh] sm:max-h-[80vh] max-w-5xl w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.url}
            alt={`${title} - ảnh ${currentIndex + 1}`}
            className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
          />
        </div>

        {/* Next button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            aria-label="Ảnh sau"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/20 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="px-4 pb-5 pt-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={lightboxThumbsRef}
            className="mx-auto flex max-w-[92vw] sm:max-w-2xl gap-2 overflow-x-auto rounded-2xl bg-black/60 p-2.5 backdrop-blur-md border border-white/10 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                ref={(el) => {
                  lightboxThumbBtnRefs.current[index] = el;
                }}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                className={cn(
                  'relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 snap-center overflow-hidden rounded-xl border-2 transition-all cursor-pointer',
                  currentIndex === index
                    ? 'border-brand-500 ring-2 ring-brand-500/40 scale-105 opacity-100 z-10'
                    : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
