import type { AmenityType } from '@/lib/constants';

/** The public amenity catalog — powers the search filter and the listing form. */
export interface Amenity {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  type: AmenityType;
}
