import 'server-only';

/**
 * Server-side fetch for SEO pages. These are public reads, so they go straight
 * to the backend — the proxy hop only exists for client calls that need the
 * session cookie.
 */

const API_URL = process.env.API_URL!;

export async function serverFetch<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const { revalidate, ...rest } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    next: { revalidate: revalidate ?? 60 },
    headers: { 'Content-Type': 'application/json', ...rest.headers },
  });

  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  return (await res.json()) as T;
}
