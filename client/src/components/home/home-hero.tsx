'use client';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
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

const ALL = '__all__';

/**
 * The brand moment, matching the reference design's structure (badge →
 * headline → floating 3-field search card) but keeping our own flat brand
 * gradient instead of a stock photo — design-system calls for a calm, quiet
 * ground so the trust signal (green, verified badge) is what stands out.
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
      district: '', // a district from a previous search may not exist in the new city
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
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-700 pb-16 pt-14 sm:pb-20 sm:pt-20">
      {/* Soft glows — opacity/blur only, no layout cost, decorative so aria-hidden. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-900/30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Mọi tin đăng đều qua kiểm duyệt
        </span>

        <h1 className="mx-auto mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
          Tìm kiếm <span className="text-brand-100">không gian sống</span> lý
          tưởng cho bạn
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-sm text-brand-50/90 sm:text-base">
          Phòng trọ, nhà nguyên căn, chung cư mini — tin thật, chủ thật, đã kiểm duyệt
          trước khi hiển thị.
        </p>
      </div>

      {/* Floating search card — overlaps the section's bottom edge like the
          reference, and is the one primary search action on the page. Hidden
          once expanded: SearchView's own toolbar takes over from there, and
          showing both at once reads as two search bars stacked on each other. */}
      {!expanded && (
        <div className="relative mx-auto -mb-24 mt-8 w-full max-w-4xl px-4 sm:-mb-10 sm:px-6">
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
