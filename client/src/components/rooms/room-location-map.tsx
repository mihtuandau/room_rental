import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomMapLazy } from './room-map-lazy';
import { RoomNearbyPlaces } from './room-nearby-places';

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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
            Vị trí &amp; Bản đồ
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-xs sm:text-sm text-zinc-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            <span>{fullAddress}</span>
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="shrink-0 font-medium">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-3.5 w-3.5 mr-1.5 text-brand-700" aria-hidden />
            Chỉ đường Google Maps
          </a>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 shadow-xs">
        {hasCoordinates ? (
          <RoomMapLazy latitude={latitude} longitude={longitude} />
        ) : (
          <div className="flex h-[180px] w-full flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <MapPin className="h-5 w-5 text-zinc-400" aria-hidden />
            </div>
            <p className="max-w-xs text-xs text-zinc-500">
              Tin đăng chưa ghim toạ độ trên bản đồ. Bạn có thể bấm nút &quot;Chỉ đường Google Maps&quot; để định vị theo địa chỉ.
            </p>
          </div>
        )}
      </div>

      {/* Real-time Nearby Places & Landmarks */}
      <RoomNearbyPlaces
        latitude={latitude}
        longitude={longitude}
        address={fullAddress}
      />
    </section>
  );
}
