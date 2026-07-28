# Trọ Ơi

Nền tảng tìm phòng trọ tại Việt Nam. Mọi tài khoản đều có thể tìm phòng,
liên hệ và đăng tin; quản trị viên duyệt tin trước khi hiển thị công khai.
Điểm khác biệt là các **tin đăng đã xác minh** và quy trình hạn chế tin giả.

```
server/   NestJS + Prisma + PostgreSQL API   ->  http://localhost:3000  (docs at /docs)
client/   Next.js frontend                   ->  http://localhost:5000
```

Each side has its own `CLAUDE.md` and `.claude/skills/` describing its rules.

## Requirements

- Node.js 20.19+ (developed on 24)
- pnpm 9
- Docker Desktop, for Postgres and Redis

## Getting started

```bash
# 1. Infrastructure (Postgres with PostGIS + Redis)
docker compose up -d

# 2. Backend
cd server
cp .env.example .env          # then fill in the Cloudinary and Google values
pnpm install
pnpm run build                # once: the seed script uses the compiled Prisma client
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
pnpm run start:dev

# 3. Frontend (in another terminal)
cd client
cp .env.example .env.local    # then fill in the Google client id
pnpm install
pnpm run dev
```

Seeded accounts, all with the password `Passw0rd!`:

| Số điện thoại | Loại tài khoản |
|---|---|
| `0900000000` | admin |
| `0911111111` | user — có tin đăng mẫu |
| `0922222222` | user |

## Notes

- The frontend runs on **5000**, not the Next.js default 3000, because the backend
  occupies 3000. The backend's `FRONTEND_URL` must match the frontend's origin
  exactly, or every request is blocked by CORS, and the backend must be restarted
  after changing it.
- Postgres is published on **5433** so it does not collide with a Postgres already
  installed on the host. The image is `postgis/postgis`, not plain `postgres`:
  the schema declares the `postgis` and `unaccent` extensions.
- Images upload straight from the browser to Cloudinary. The backend only issues
  signatures and stores the resulting URLs, so it never handles file bytes.

## Production images

```bash
docker build -t roomrent-server ./server

# NEXT_PUBLIC_* values are inlined at build time, so they are build args rather
# than runtime env: an image built for one environment cannot be reused in another.
docker build -t roomrent-client ./client \
  --build-arg NEXT_PUBLIC_SITE_URL=https://roomrent.example \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

The server image deliberately excludes the Prisma CLI, so `prisma migrate deploy`
cannot run inside it. Apply migrations as a separate release step, from CI or a
one-off container built on the Dockerfile's `build` stage.

## Not built yet

The backend is complete (50 endpoints). The frontend has its foundation, namely
providers, BFF proxy routes, design tokens and base components, but the product
screens (search, listing detail, auth pages, posting flow, admin) are still to do.

Deployment automation (CD) is intentionally left until the app is usable and a
hosting target has been chosen.
