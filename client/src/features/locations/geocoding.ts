interface LocationParts {
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
}

function joinLocationParts(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

/**
 * Nominatim may not know a business name or an unaccented ward. Search from
 * the most specific address down to the surrounding district so the user
 * still gets a useful starting pin to adjust manually.
 */
export function buildLocationSearchQueries({
  address,
  ward,
  district,
  city,
}: LocationParts) {
  const candidates = [
    joinLocationParts([address, ward, district, city, 'Việt Nam']),
    joinLocationParts([address, district, city, 'Việt Nam']),
    joinLocationParts([address, city, 'Việt Nam']),
    joinLocationParts([ward, district, city, 'Việt Nam']),
    joinLocationParts([district, city, 'Việt Nam']),
  ];

  return Array.from(new Set(candidates.filter((query) => query.length >= 3)));
}
