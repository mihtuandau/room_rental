import {
  AirVent,
  Armchair,
  ArrowUpRight,
  Bath,
  Building2,
  Camera,
  Hospital,
  PawPrint,
  Refrigerator,
  School,
  ShieldCheck,
  SquareParking,
  Store,
  Tags,
  WashingMachine,
  Wifi,
} from 'lucide-react';

export function AmenitySymbol({ icon }: { icon: string | null }) {
  const isEmoji = Boolean(icon && /\p{Extended_Pictographic}/u.test(icon));
  const Icon = {
    wifi: Wifi,
    ac: AirVent,
    'water-heater': Bath,
    fridge: Refrigerator,
    balcony: Building2,
    furniture: Armchair,
    pet: PawPrint,
    'washing-machine': WashingMachine,
    elevator: ArrowUpRight,
    parking: SquareParking,
    shield: ShieldCheck,
    camera: Camera,
    market: Store,
    school: School,
    hospital: Hospital,
  }[icon ?? ''];

  if (isEmoji) return <>{icon}</>;
  if (Icon) return <Icon className="h-5 w-5 text-brand-700" />;
  return <Tags className="h-5 w-5 text-brand-700" />;
}
