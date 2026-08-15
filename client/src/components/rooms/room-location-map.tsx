import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomMapLazy } from './room-map-lazy';

/**
 * Location on the listing detail page — keyless MapLibre + OpenStreetMap (see
 * lib/map-style.ts), same as the search results map, no API key or billing
 * account required. "Chỉ đường" is a plain google.com/maps URL — no key
 * either, and it's what actually gets someone walking directions on their
 * phone regardless of which map renders the preview.
 */
export function RoomLocationMap({
  address,
  ward,
  district,
  city,
  latitude,
  longitude,
}: {
  address: string | null;
  ward: string | null;
  district: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const fullAddress = [address, ward, district, city].filter(Boolean).join(', ');
  const hasCoordinates = latitude != null && longitude != null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    hasCoordinates ? `${latitude},${longitude}` : fullAddress,
  )}`;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Vị trí</h2>
      <p className="flex items-start gap-2 text-sm text-zinc-600">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        {fullAddress}
      </p>

      {hasCoordinates ? (
        <RoomMapLazy latitude={latitude} longitude={longitude} />
      ) : (
        // The listing form doesn't collect a pinned location yet, so this is
        // the honest state for most current listings — not a broken map.
        <div className="flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-center">
          <MapPin className="h-6 w-6 text-zinc-400" aria-hidden />
          <p className="max-w-xs text-sm text-zinc-500">
            Tin này chưa có toạ độ chính xác. Bấm &quot;Chỉ đường&quot; để tìm theo địa chỉ.
          </p>
        </div>
      )}

      <Button variant="outline" asChild>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <Navigation className="h-4 w-4" aria-hidden />
          Chỉ đường
        </a>
      </Button>
    </section>
  );
}
