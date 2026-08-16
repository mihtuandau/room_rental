import {
  Bath,
  BedDouble,
  Check,
  Ruler,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { RoomDetail } from '@/features/rooms/api';
import { AMENITY_TYPE_LABELS, type AmenityType } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

const AMENITY_TYPE_ORDER: AmenityType[] = [
  'basic',
  'utility',
  'security',
  'nearby',
];

export function RoomFacts({ room }: { room: RoomDetail }) {
  const facts: Array<{ icon: LucideIcon; value: string; label: string }> = [
    room.area != null && {
      icon: Ruler,
      value: `${room.area} m²`,
      label: 'Diện tích',
    },
    room.deposit != null && {
      icon: Wallet,
      value: formatPrice(room.deposit),
      label: 'Tiền đặt cọc',
    },
    room.bedrooms != null && {
      icon: BedDouble,
      value: `${room.bedrooms} phòng`,
      label: 'Phòng ngủ',
    },
    room.bathrooms != null && {
      icon: Bath,
      value: `${room.bathrooms} phòng`,
      label: 'Phòng tắm',
    },
    room.maxOccupants != null && {
      icon: Users,
      value: `${room.maxOccupants} người`,
      label: 'Sức chứa',
    },
  ].filter(
    (fact): fact is { icon: LucideIcon; value: string; label: string } => Boolean(fact),
  );

  if (!facts.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 py-4 border-y border-zinc-200/80">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <fact.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-zinc-500 font-medium truncate">{fact.label}</p>
            <p className="font-heading text-xs sm:text-sm md:text-base font-semibold text-zinc-900 truncate">
              {fact.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoomAmenities({ room }: { room: RoomDetail }) {
  const groups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: room.amenities.filter((amenity) => amenity.type === type),
  })).filter((group) => group.items.length > 0);

  if (!groups.length) return null;

  return (
    <section className="border-t border-zinc-200/80 pt-7 space-y-4">
      <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
        Tiện ích phòng
      </h2>

      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <div key={group.type} className="space-y-3">
            <p className="text-xs font-semibold text-zinc-500">
              {AMENITY_TYPE_LABELS[group.type]}
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {group.items.map((amenity) => (
                <li key={amenity.id} className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Check className="h-3 w-3 stroke-[2.5]" aria-hidden />
                  </span>
                  <span>{amenity.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
