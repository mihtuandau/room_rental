'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRICE_RANGE_OPTIONS, ROOM_TYPE_OPTIONS, type RoomType } from '@/lib/constants';
import type { ProvinceOption } from '@/features/locations/api';
import { isSearchExpanded, searchParsers } from '@/features/rooms/search-params';
import { HeroBannerCarousel } from './hero-banner-carousel';

const ALL = '__all__';

/**
 * The brand moment: the marketing banner (logo, headline, and CTA are baked
 * into the image itself) with the one *real* search action — a floating
 * 3-field card — overlapping its bottom edge. `next/image` gets the real
 * intrinsic size so `w-full h-auto` scales it without layout shift or
 * guessing an aspect ratio.
 *
 * The three fields are a *draft* — picking one only updates local state, not
 * the URL. Only pressing "Tìm kiếm" commits them, which is what flips
 * SearchView (a sibling, reading the same URL) into its full results mode.
 * Committing per-field felt broken: touching one dropdown before you'd
 * finished choosing already swapped the whole page out from under you.
 */
export function HomeHero({ provinces }: { provinces: ProvinceOption[] }) {
  const [urlState, setUrlState] = useQueryStates(searchParsers, {
    history: 'push',
    shallow: true,
  });

  const [city, setCity] = useState(urlState.city);
  const [roomType, setRoomType] = useState<RoomType | null>(urlState.roomType);
  const [priceRangeValue, setPriceRangeValue] = useState(
    PRICE_RANGE_OPTIONS.find(
      (p) => p.priceMin === urlState.priceMin && p.priceMax === urlState.priceMax,
    )?.value ?? ALL,
  );

  // Same signal SearchView reads (a sibling, not a child — the URL is the only
  // thing they share). Once true, this card hides so it never stacks with the
  // full toolbar SearchView renders below.
  const expanded = isSearchExpanded(urlState);

  const submit = () => {
    const range = PRICE_RANGE_OPTIONS.find((p) => p.value === priceRangeValue);
    setUrlState({
      city,
      ward: '', // a ward from a previous search may not exist in the new city
      roomType,
      priceMin: range?.priceMin ?? null,
      priceMax: range?.priceMax ?? null,
      // Guarantees expansion even if every field is still on its default
      // (e.g. the user pressed "Tìm kiếm" without picking anything).
      all: true,
      page: 1,
    });
    document.getElementById('ket-qua')?.scrollIntoView({ behavior: 'smooth' });
  };

  // The whole hero — badge, headline, and search card alike — only belongs on
  // the landing/browse screen. On results, SearchView's own heading takes
  // over as the page's h1 (see its `resultsHeading`); a marketing banner
  // above a results grid is dead weight, not a design detail to keep.
  if (expanded) return null;

  return (
    <section className="relative isolate overflow-hidden pb-16 sm:pb-20">
      {/* The banner's headline is baked into the image (not real text), so the
          page still needs an actual h1 for SEO/screen readers — same wording,
          visually hidden since the image already shows it. */}
      <h1 className="sr-only">Trọ Ơi — Tìm trọ dễ dàng, sống an tâm mỗi ngày</h1>

      {/* Full-bleed on purpose here (unlike other sections' max-w-6xl px-4
          wrapper) — the carousel's own centre slide is capped to match that
          same 1152px width internally, but the side peek slides are meant to
          spill past it into the gutters for the coverflow look. */}
      <HeroBannerCarousel />

      {/* Search card — no longer overlapping the banner's bottom edge like
          the old single-image version did, since the carousel now has its
          own dot pagination sitting there instead. */}
      {!expanded && (
        <div className="relative mx-auto mt-8 w-full max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-white p-3 shadow-popover sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-zinc-200">
            <Field label="Vị trí">
              <Select value={city || ALL} onValueChange={(v) => setCity(v === ALL ? '' : v)}>
                <SelectTrigger className="h-9 border-0 px-0 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toàn quốc</SelectItem>
                  {provinces.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Loại phòng">
              <Select
                value={roomType ?? ALL}
                onValueChange={(v) => setRoomType(v === ALL ? null : (v as RoomType))}
              >
                <SelectTrigger className="h-9 border-0 px-0 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả loại phòng</SelectItem>
                  {ROOM_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Mức giá">
              <Select value={priceRangeValue} onValueChange={setPriceRangeValue}>
                <SelectTrigger className="h-9 border-0 px-0 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Mọi mức giá</SelectItem>
                  {PRICE_RANGE_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Button onClick={submit} className="mt-1 shrink-0 sm:mt-0 sm:ml-3">
              <Search className="h-4 w-4" aria-hidden />
              Tìm kiếm
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 px-3 py-1 text-left first:pl-1 sm:first:pl-3">
      <span className="block text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </div>
  );
}
