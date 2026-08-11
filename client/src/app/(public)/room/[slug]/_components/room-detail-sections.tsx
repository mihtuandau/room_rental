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
import {
  AMENITY_TYPE_LABELS,
  type AmenityType,
} from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

const AMENITY_TYPE_ORDER: AmenityType[] = [
  'basic',
  'utility',
  'security',
  'nearby',
];

export function RoomFacts({ room }: { room: RoomDetail }) {
  const facts: Array<{ icon: LucideIcon; label: string }> = [
    room.bedrooms != null && {
      icon: BedDouble,
      label: `${room.bedrooms} phòng ngủ`,
    },
    room.bathrooms != null && {
      icon: Bath,
      label: `${room.bathrooms} phòng tắm`,
    },
    room.area != null && { icon: Ruler, label: `${room.area} m²` },
    room.maxOccupants != null && {
      icon: Users,
      label: `Tối đa ${room.maxOccupants} người`,
    },
    room.deposit != null && {
      icon: Wallet,
      label: `Cọc ${formatPrice(room.deposit)}`,
    },
  ].filter(
    (fact): fact is { icon: LucideIcon; label: string } => Boolean(fact),
  );

  if (!facts.length) return null;
  return (
    <section
      aria-label="Thông tin chính"
      className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-3 sm:p-5 md:grid-cols-5"
    >
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex flex-col items-center gap-2 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
            <fact.icon className="h-5 w-5 text-brand-700" aria-hidden />
          </span>
          <span className="text-sm font-medium text-zinc-700">
            {fact.label}
          </span>
        </div>
      ))}
    </section>
  );
}

export function RoomAmenities({ room }: { room: RoomDetail }) {
  const groups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: room.amenities.filter((amenity) => amenity.type === type),
  })).filter((group) => group.items.length > 0);

  if (!groups.length) return null;
  return (
    <section className="border-t border-zinc-200 pt-6">
      <h2 className="text-lg font-semibold">Tiện ích</h2>
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.type} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {AMENITY_TYPE_LABELS[group.type]}
            </p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {group.items.map((amenity) => (
                <li
                  key={amenity.id}
                  className="flex items-center gap-2 text-sm text-zinc-700"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-brand-700"
                    aria-hidden
                  />
                  {amenity.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
