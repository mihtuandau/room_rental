# RoomRent FRONTEND — Project Rules

> Applies to the Frontend repo (`client/`). The Backend (NestJS, `server/`) is a
> **separate project** — the frontend only talks to it over the HTTP API and never
> touches the database.
> The "🚫 HARD RULES" section is mandatory and must never be violated, even if a prompt asks for it.

---

## 1. Product

Room-rental discovery web app (MVP). Three roles: tenant, landlord, admin.
USP: **verified listings**. SEO is the primary traffic channel → most public pages must be server-rendered.

**Important:** there is no role choice at signup. Any signed-in user can both search for rooms and post listings — `role` exists only to gate `/admin`. The UI is split into "modes", not accounts:

| Mode | Routes | Who |
|---|---|---|
| Public (find a room) | `/`, `/search`, `/room/[slug]` | everyone, including guests |
| My listings | `/manage/*` | any signed-in user |
| Admin | `/admin/*` | `role === "admin"` only |

A header button switches between the first two ("Tin của tôi" ↔ "← Về trang tìm phòng"). No upgrade flow, no extra signup.

---

## 2. Tech stack (fixed)

- **Framework**: Next.js 16 (App Router, React Server Components), React 19
- **UI**: Tailwind CSS v4 + Radix UI primitives, wrapped into styled components under `components/ui/` (shadcn-style) — never repeat raw Radix + inline styles at each call site
- **Server state**: TanStack React Query — everything that comes from the API
- **Client state**: Zustand — UI-only state (never server data)
- **URL state**: `nuqs` — search filters live in the URL so results stay shareable and indexable
- **Forms**: `react-hook-form` + `zod` (`@hookform/resolvers/zod`)
- **Icons**: `lucide-react` · **Toasts**: `sonner` · **Variants**: `class-variance-authority`
- **Google Sign-In**: `@react-oauth/google`
- **Carousel**: `embla-carousel-react` (room image gallery)
- **API types**: generated from the backend's OpenAPI spec (`openapi-typescript` against `/docs-json`) — never hand-write response types

Don't add new libraries without a clear reason.

**Dev ports**: frontend runs on **5000**, backend on **3000**. The backend's `FRONTEND_URL` must equal `http://localhost:5000` or every request fails CORS with an opaque "Failed to fetch". Restart the backend after changing its `.env`.

---

## 3. 🚫 HARD RULES

1. **Client Components never call the backend domain directly.** They go through Next Route Handlers under `/app/api/*` (BFF proxy), which forward to NestJS. This keeps the session cookie first-party (third-party cookies are increasingly blocked) and keeps the backend URL server-side.
2. **The access token is never stored in `localStorage`/`sessionStorage`, and never in a cookie readable by JS.** Session cookies are set by Next Route Handlers with `httpOnly: true`.
3. **Client-side zod validation is for UX only.** The backend validates everything again — never skip a check server-side because "the form already checked it".
4. **Never put personal data (phone, email, user id) in a URL or query string.**
5. **Server Components** for anything that needs SEO (search, detail, area landings) — they `fetch()` the backend directly with `next: { revalidate }`. **Client Components** for interaction (filters, favorites, forms) — React Query through the proxy route.
6. **Never store server data in Zustand** (rooms, profile, favorites-after-login). That's React Query's job — two sources of truth causes stale UI.
7. **`middleware.ts` only does a coarse check** for the presence of the session cookie (redirect to login for `/manage`, `/admin`). It must not verify JWT signatures at the edge — real authorisation is the backend returning 401/403.

---

## 4. Directory structure

```
client/
├── src/
│   ├── app/
│   │   ├── (public)/          # SSR, SEO-critical
│   │   │   ├── page.tsx                  # home
│   │   │   ├── search/page.tsx           # search results
│   │   │   └── room/[slug]/page.tsx      # listing detail
│   │   ├── (auth)/            # login, register, forgot-password
│   │   ├── manage/            # "my listings" mode — any signed-in user
│   │   ├── admin/             # admin only
│   │   ├── api/               # Route Handlers ONLY (BFF proxy) — no business logic
│   │   │   ├── auth/{login,google,logout,refresh}/route.ts
│   │   │   └── proxy/[...path]/route.ts
│   │   ├── layout.tsx · globals.css · loading.tsx · error.tsx · not-found.tsx · sitemap.ts
│   ├── components/
│   │   ├── ui/                # Radix + Tailwind, named after the Radix primitive
│   │   ├── rooms/             # room-card, room-gallery, room-list
│   │   ├── search/            # search-bar, filter-panel
│   │   └── layout/            # header, footer, sidebar
│   ├── features/              # per feature: api.ts (fetch) + hooks.ts (React Query) + schemas.ts (zod)
│   │   ├── auth/ · rooms/ · favorites/ · saved-searches/ · reports/ · amenities/
│   ├── stores/                # Zustand — UI state only
│   ├── lib/                   # api-client.ts, query-client.ts, utils.ts, constants.ts
│   ├── types/api.d.ts         # GENERATED from OpenAPI — never edit by hand
│   └── hooks/                 # pure UI hooks (use-debounce, ...)
├── middleware.ts              # must sit outside src/, next to package.json
└── .env.local / .env.example  # only NEXT_PUBLIC_* + server-only API_URL. Never DATABASE_URL.
```

---

## 5. Code conventions

- TypeScript strict, no `any`. Request/response types come from `types/api.d.ts` (generated).
- Server Component by default; add `"use client"` only when state/effects/interaction are needed.
- Each feature separates `api.ts` (plain fetch functions) from `hooks.ts` (React Query wrappers) — easier to test and reusable from Server Components.
- Always handle three states: loading (`loading.tsx` or `isPending`), empty, error (`error.tsx` or `isError`). Never leave a blank screen.
- Shared Radix components live in `components/ui/` and keep the Radix name (`Dialog`, `Select`).

---

## 6. Data fetching — required approach

| Situation | Approach |
|---|---|
| Page needs SEO (search, detail, landing) | Server Component, `fetch()` the backend directly, `next: { revalidate: N }` |
| Interaction after load (filters, pagination) | Client Component + React Query via `/api/proxy/...` |
| Mutation (post listing, favorite, report) | React Query `useMutation` via the proxy route |
| Needs both SEO and fast interaction | Server Component prefetch → `dehydrate()` → `<HydrationBoundary>` → Client `useQuery` reuses the cache |
| Login / logout / Google sign-in | Dedicated Route Handlers — the only place allowed to set cookies |

---

## 7. Zustand — only for

- Search filters being edited before submit (URL is the source of truth once on the results page).
- Modal/drawer open state, current step of a multi-step form.
- Temporary favorites while signed out (before syncing to the server).

Never for: room lists, room detail, profile, or anything returned by the API.

---

## 8. SEO (required — primary traffic channel)

- Listing URLs use the slug: `/room/<room-slug>`, never `?id=`.
- Every public page has `generateMetadata` (title, description, canonical, OpenGraph).
- Listing detail pages include JSON-LD (schema.org).
- `sitemap.ts` is generated from active listings fetched from the backend.
- Area landing pages (`/rooms-for-rent/quan-7`) to capture local search terms.

> **Routes are English, UI text is Vietnamese.** URL paths and file/folder names use
> English (`/login`, `/search`, `/room/[slug]`, `/manage/*`); everything a user reads on
> screen stays Vietnamese per skill `vietnamese-ux-writing`. Area-landing slugs keep the
> Vietnamese place name (`quan-7`) — that is the term people actually search.

---

## 9. Design consistency (non-negotiable)

Consistency is a correctness concern here, not a matter of taste — a listing site lives
or dies on looking trustworthy.

1. **No invented values.** Every colour, font size, radius, shadow and spacing step comes
   from the tokens in skill `design-system`. A raw hex code or a one-off `mt-[13px]` in a
   component is a bug.
2. **Every data screen handles four states** — loading (skeleton), empty, error, denied —
   per skill `ui-state-patterns`. A blank rectangle while loading is not acceptable.
3. **All user-facing text follows skill `vietnamese-ux-writing`**: sentence case, "bạn",
   and the canonical term for each concept (always "tin đăng", never "bài đăng"). Backend
   messages are English and developer-facing — never show them to a user.
4. **Reusable elements live in `components/ui/`** and are built once (skill
   `add-ui-component`). If a button, badge or dialog is being styled inline in a page,
   it belongs in `components/ui/` instead.
5. **Enum→label mappings live only in `lib/constants.ts`.** Retyping "Chung cư mini" in a
   component is how it becomes "Chung cư Mini" somewhere else.

---

## 10. Display conventions (Vietnam-specific)

- VND: `4.500.000 ₫` or `4,5 triệu/tháng` — helpers live in `lib/utils.ts`.
- Prefer a **Zalo** button and a phone-call button on the detail page; realtime chat is out of scope.
- `RoomType` is stored in English on the backend and displayed in Vietnamese. Keep that mapping in **one place** (`lib/constants.ts`):

| API value | Label |
|---|---|
| `boarding_house` | Phòng trọ |
| `whole_house` | Nhà nguyên căn |
| `mini_apartment` | Chung cư mini |
| `serviced_apartment` | Căn hộ dịch vụ |
| `shared_room` | Ở ghép |

- Backend errors come back as `{ statusCode, message, timestamp }` where `message` is a string **or an array of strings** (validation). Always handle both.

---

## 11. When AI writes code, always:

**Read before styling or writing copy — these apply to every task:**

- Any styling decision → skill `design-system`
- Any screen showing data → skill `ui-state-patterns`
- Any user-facing text → skill `vietnamese-ux-writing`

**Task-specific:**

1. Setting up providers / API client / folder scaffolding → skill `bootstrap-frontend-setup`
2. New page → skill `create-page-with-seo`
3. Client-side data fetching → skill `add-react-query-hook`
4. Pure UI state → skill `add-zustand-store`
5. Login/logout/cookie routes → skill `add-bff-proxy-route`
6. Shared Radix component → skill `add-ui-component`
7. Any form → skill `add-form`
8. Image upload → skill `upload-image-cloudinary`
9. Before calling a new endpoint, check `types/api.d.ts`; if the backend changed, regenerate the types

---

## 12. Git / commits

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- Never commit `.env*`, `node_modules`, `.next/`.
