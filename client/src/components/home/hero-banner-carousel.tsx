'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type { EmblaCarouselType, EmblaEventType } from 'embla-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slide {
  src: string;
  alt: string;
}

const SLIDES: Slide[] = [
  { src: '/banner.png', alt: 'Trọ Ơi — tìm trọ dễ dàng, sống an tâm mỗi ngày' },
  { src: '/banner1.png', alt: 'Trọ Ơi — hàng ngàn phòng trọ đẹp, giá tốt, vị trí thuận tiện' },
  { src: '/banner2.png', alt: 'Trọ Ơi — có ngay chỗ tốt' },
];

// How aggressively side slides shrink/fade as they move away from centre —
// see setTweenFactor below (scaled by slide count, same constant embla's own
// "Scale" example uses: https://www.embla-carousel.com/examples/predefined/#scale).
const TWEEN_FACTOR_BASE = 0.2;
const MIN_SCALE = 0.78;
const MIN_OPACITY = 0.55;

function numberWithinRange(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Coverflow-style hero banner: a large, sharp centre slide with the
 * neighbours peeking in smaller and dimmer to either side. Dragging/swiping
 * moves smoothly between them (no discrete jump); autoplay advances every
 * 4.5s and permanently stops the moment a user drags, clicks a dot, or uses
 * the arrow buttons (embla-carousel-autoplay's stopOnInteraction).
 *
 * The scale/opacity tween is embla's own documented "Scale" pattern — each
 * slide's distance from the current scroll position (not just its discrete
 * index) drives its scale, so the effect stays continuous while dragging
 * instead of snapping between two fixed states.
 */
export function HeroBannerCarousel() {
  // Lazy initializer, not a plain call — constructing the plugin is a one-time
  // side effect that must not re-run on every render, and reading a ref's
  // .current during render (the alternative) is disallowed by the compiler.
  const [autoplayPlugin] = useState(() =>
    Autoplay({ delay: 4500, stopOnInteraction: true, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [
    autoplayPlugin,
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);

  const setTweenNodes = useCallback((api: EmblaCarouselType) => {
    tweenNodes.current = api
      .slideNodes()
      .map((slideNode) => slideNode.querySelector<HTMLElement>('[data-slide-inner]'))
      .filter((el): el is HTMLElement => el !== null);
  }, []);

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  const tweenScale = useCallback((api: EmblaCarouselType, eventName?: EmblaEventType) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === 'scroll';

    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
              if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          });
        }

        const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
        const scale = numberWithinRange(tweenValue, MIN_SCALE, 1);
        const opacity = numberWithinRange(tweenValue, MIN_OPACITY, 1);
        const node = tweenNodes.current[slideIndex];
        if (node) {
          node.style.transform = `scale(${scale})`;
          node.style.opacity = String(opacity);
        }
      });
    });
  }, []);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads embla's real initial state, same pattern as latest-listings-carousel.tsx
    onSelect(emblaApi);

    emblaApi
      .on('reInit', setTweenNodes)
      .on('reInit', setTweenFactor)
      .on('reInit', tweenScale)
      .on('reInit', onSelect)
      .on('scroll', tweenScale)
      .on('slideFocus', tweenScale)
      .on('select', onSelect);

    return () => {
      emblaApi
        .off('reInit', setTweenNodes)
        .off('reInit', setTweenFactor)
        .off('reInit', tweenScale)
        .off('reInit', onSelect)
        .off('scroll', tweenScale)
        .off('slideFocus', tweenScale)
        .off('select', onSelect);
    };
  }, [emblaApi, setTweenNodes, setTweenFactor, tweenScale, onSelect]);

  return (
    <div className="relative px-4 sm:px-6">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              // The centre slide caps at 1152px (max-w-6xl, same as every
              // other home section) so it reads as "the same size", while
              // still being percentage-based below that so the side slides
              // have room to peek in and spill past that width on wide screens.
              className="min-w-0 flex-[0_0_88%] px-2 sm:flex-[0_0_78%] sm:px-3 lg:flex-[0_0_min(70%,1152px)]"
            >
              <div
                data-slide-inner
                className="relative aspect-video overflow-hidden rounded-xl shadow-popover [will-change:transform,opacity]"
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 70vw, 88vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Banner trước"
        className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-700 shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Banner tiếp theo"
        className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-700 shadow-card transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:flex"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>

      <div className="mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Xem banner ${i + 1}`}
            aria-current={i === selectedIndex}
            className={cn(
              'h-2 rounded-full transition-all',
              i === selectedIndex ? 'w-6 bg-brand-600' : 'w-2 bg-zinc-300 hover:bg-zinc-400',
            )}
          />
        ))}
      </div>
    </div>
  );
}
