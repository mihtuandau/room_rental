import {
  Bath,
  BedDouble,
  Check,
  Ruler,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { RoomDetail } from '@/features/rooms/api';
import { AMENITY_TYPE_LABELS, type AmenityType } from '@/lib/constants';

const AMENITY_TYPE_ORDER: AmenityType[] = [
  'basic',
  'utility',
  'security',
  'nearby',
];

export function RoomFacts({ room }: { room: RoomDetail }) {
  const facts: Array<{ icon: LucideIcon; value: string; label: string }> = [
    room.bedrooms != null && {
      icon: BedDouble,
      value: String(room.bedrooms),
      label: 'Phòng ngủ',
    },
    room.bathrooms != null && {
      icon: Bath,
      value: String(room.bathrooms),
      label: 'Phòng tắm',
    },
    room.area != null && {
      icon: Ruler,
      value: `${room.area} m²`,
      label: 'Diện tích',
    },
    room.maxOccupants != null && {
      icon: Users,
      value: String(room.maxOccupants),
      label: 'Số người tối đa',
    },
  ].filter(
    (fact): fact is { icon: LucideIcon; value: string; label: string } => Boolean(fact),
  );

  if (!facts.length) return null;

  return (
    <section aria-label="Thông tin chính" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex min-h-28 flex-col items-start justify-center gap-2 rounded-xl border border-border-subtle bg-surface-card p-4"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
            <fact.icon className="h-4 w-4 text-brand-700" aria-hidden />
          </span>
          <span className="text-lg font-semibold leading-none text-zinc-900">{fact.value}</span>
          <span className="text-xs font-medium text-zinc-500">{fact.label}</span>
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
                <li key={amenity.id} className="flex items-center gap-2 text-sm text-zinc-700">
                  <Check className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
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
