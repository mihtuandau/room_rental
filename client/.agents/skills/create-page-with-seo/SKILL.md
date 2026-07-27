---
name: create-page-with-seo
description: "Create RoomRent Next.js App Router pages with appropriate Server Component data fetching, metadata, canonical URLs, OpenGraph data, JSON-LD, and sitemap handling. Use whenever Codex adds or changes a public page, listing detail, area landing, home/search experience, management screen, or admin screen. Apply full SEO to public indexable routes and safe access handling to protected routes."
---

# Creating an App Router page with SEO

## Rules

- SEO-relevant pages (search, detail, landings) are **Server Components** that call the
  backend directly with `serverFetch` — the proxy hop is only needed for client-side
  calls that require the session cookie.
- Use slugs, never `?id=`.
- Every public page exports `generateMetadata`.
- Listing detail pages include JSON-LD.
- Protected areas (`/manage`, `/admin`) get a coarse cookie check in `middleware.ts`;
  the backend's 401/403 is the real authorisation.

## Template: home and search results page

RoomRent currently combines the home and search experience at `/`. Keep filter
state in the home URL rather than inventing a separate `/search` route unless the
product routing requirement explicitly changes.

`src/app/(public)/page.tsx`
```tsx
import type { Metadata } from "next";
import { serverFetch } from "@/lib/server-api";
import { buildSearchQuery, type SearchParams } from "@/features/rooms/api";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { district, city, roomType } = await searchParams;
  const what = roomType ? ROOM_TYPE_LABELS[roomType] : "Phòng trọ";
  const where = district ?? city;
  const title = where ? `${what} ${where} — tin xác minh | RoomRent` : `${what} cho thuê | RoomRent`;

  return {
    title,
    description: `Tìm ${what.toLowerCase()} ${where ?? "trên toàn quốc"}. Tin đăng đã kiểm duyệt, cập nhật mỗi ngày.`,
    alternates: { canonical: "/" },
    // filtered permutations are near-duplicates — let the canonical landing pages rank
    robots: where ? { index: false, follow: true } : undefined,
  };
}

export default async function Page({ searchParams }: Props) {
  const filters = await searchParams;
  const data = await serverFetch<{ rooms: Room[]; total: number }>(
    `/rooms?${buildSearchQuery(filters)}`,
    { revalidate: 60 },
  );

  if (data.total === 0) return <EmptyState message="Không tìm thấy phòng phù hợp." />;
  return <RoomList rooms={data.rooms} total={data.total} />;
}
```

## Template: listing detail + JSON-LD

`src/app/(public)/room/[slug]/page.tsx`
```tsx
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

// public route is /room/<slug>, the API path is /rooms/<slug>
async function getRoom(slug: string) {
  return serverFetch<RoomDetail>(`/rooms/${slug}`, { revalidate: 120 }).catch(() => null);
}

export async function generateMetadata({ params }: Props) {
  const room = await getRoom((await params).slug);
  if (!room) return {};
  return {
    title: `${room.title} — ${formatPrice(room.price)}/tháng | RoomRent`,
    description: room.description?.slice(0, 155),
    alternates: { canonical: `/room/${room.slug}` },
    openGraph: {
      title: room.title,
      images: room.images?.[0] ? [room.images[0].url] : [],
      type: "website",
    },
  };
}

export default async function Page({ params }: Props) {
  const room = await getRoom((await params).slug);
  if (!room) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: room.title,
    description: room.description,
    numberOfRooms: room.bedrooms ?? undefined,
    floorSize: room.area
      ? { "@type": "QuantitativeValue", value: room.area, unitCode: "MTK" }
      : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: room.district,
      addressRegion: room.city,
      addressCountry: "VN",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RoomDetailView room={room} />
    </>
  );
}
```

> `GET /rooms/:slug` increments `viewCount` on every call. Keep `revalidate` modest so
> the count reflects genuine visits rather than one hit per cache rebuild.

## Template: dynamic sitemap

`src/app/sitemap.ts`
```ts
import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/server-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  // there is no dedicated sitemap endpoint — page through the public search
  const { rooms } = await serverFetch<{ rooms: { slug: string; updatedAt: string }[] }>(
    "/rooms?pageSize=1000",
    { revalidate: 3600 },
  );

  return [
    { url: base, lastModified: new Date(), priority: 1 },
    ...rooms.map((r) => ({
      url: `${base}/room/${r.slug}`,
      lastModified: new Date(r.updatedAt),
      priority: 0.6,
    })),
  ];
}
```

## Protected pages

`middleware.ts` (next to `package.json`, **not** inside `src/`):
```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // presence check only — never verify the JWT signature at the edge
  const signedIn = req.cookies.has("rr_session") || req.cookies.has("rr_refresh");
  if (!signedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname); // return here after login
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/manage/:path*", "/admin/:path*"] };
```

The access cookie expires long before the refresh cookie, so check for **either** —
testing only `rr_session` would bounce a still-valid session to the login page.

Admin pages must additionally verify the role by calling the API — the middleware
cannot tell an admin from a tenant, and `/admin/*` endpoints answer 403 regardless.

## Do NOT
- Ship a public page without `generateMetadata`.
- Use `?id=` in a public URL instead of the slug.
- Let filtered search permutations be indexed — they compete with the landing pages.
- Rely on the middleware for authorisation; it's a redirect convenience only.

## Checklist
- [ ] Server Component for the main content, fetched via `serverFetch`
- [ ] Slug-based URL
- [ ] `generateMetadata` with title, description, canonical, OpenGraph
- [ ] Listing detail has JSON-LD
- [ ] Added to `sitemap.ts` if it should be indexed
- [ ] Protected route matched in `middleware.ts`, with the real check still server-side
- [ ] loading / empty / notFound all handled
