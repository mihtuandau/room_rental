import type { AmenityType } from '@/lib/constants';

export const AMENITY_TYPES: AmenityType[] = [
  'basic',
  'utility',
  'security',
  'nearby',
];

export const AMENITY_TYPE_LABELS: Record<AmenityType, string> = {
  basic: 'Cơ bản',
  utility: 'Tiện nghi',
  security: 'An ninh',
  nearby: 'Xung quanh',
};

export const AMENITY_ICON_OPTIONS = [
  'wifi',
  'ac',
  'water-heater',
  'fridge',
  'balcony',
  'furniture',
  'pet',
  'washing-machine',
  'elevator',
  'parking',
  'shield',
  'camera',
  'market',
  'school',
  'hospital',
] as const;

export const AMENITY_ICON_LABELS: Record<
  (typeof AMENITY_ICON_OPTIONS)[number],
  string
> = {
  wifi: 'WiFi',
  ac: 'Điều hòa',
  'water-heater': 'Nóng lạnh',
  fridge: 'Tủ lạnh',
  balcony: 'Ban công',
  furniture: 'Nội thất',
  pet: 'Thú cưng',
  'washing-machine': 'Máy giặt',
  elevator: 'Thang máy',
  parking: 'Chỗ để xe',
  shield: 'Bảo vệ',
  camera: 'Camera',
  market: 'Chợ',
  school: 'Trường học',
  hospital: 'Bệnh viện',
};

export type AmenityFormValues = {
  name: string;
  type: AmenityType;
  icon?: string;
  description?: string;
  isActive?: boolean;
};

export type AmenityStatusFilter = 'all' | 'active' | 'inactive';
export type AmenitySort = 'name' | 'usage';
