import slugifyLib from 'slugify';

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true, locale: 'vi' });
}

// Appends a short random suffix to guarantee uniqueness even if two listings share a title.
export function uniqueSlug(text: string): string {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${slugify(text)}-${suffix}`;
}
