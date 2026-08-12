/**
 * Keep post-auth redirects on this application. External URLs are rejected so
 * the `next` query parameter cannot become an open redirect.
 */
export function getSafeAuthNext(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}
