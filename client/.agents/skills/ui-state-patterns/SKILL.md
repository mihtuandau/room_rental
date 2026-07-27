---
name: ui-state-patterns
description: "Implement RoomRent loading, empty, error, permission-denied, mutation-pending, skeleton, and pagination states. Use whenever Codex builds or changes a screen that renders data that may be absent, delayed, unauthorized, or failed. Ensure data-driven interfaces never collapse into blank content or expose raw errors."
---

# Loading, empty, error, denied

Every screen that renders API data handles **four** states, not one. Skipping them is
the most common way a screen ships looking broken:

| State | What the user sees |
|---|---|
| Loading | A skeleton shaped like the real content — never a spinner on a blank page |
| Empty | An explanation plus the action that resolves it |
| Error | A plain-language message plus a retry |
| Denied (401/403) | A sign-in prompt or a clear "not yours" message — never a generic error |

## Skeletons must match the layout

A skeleton that doesn't match the real content causes a visible jump when data lands.
Build it from the same grid and sizes as the component it replaces.

`src/components/ui/skeleton.tsx`
```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-100", className)} />;
}
```

`src/components/rooms/room-card-skeleton.tsx`
```tsx
export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <Skeleton className="aspect-[4/3] w-full rounded-none" /> {/* same ratio as the photo */}
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />   {/* title */}
        <Skeleton className="h-4 w-1/2" />   {/* location */}
        <Skeleton className="h-6 w-1/3" />   {/* price */}
      </div>
    </div>
  );
}

export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => <RoomCardSkeleton key={i} />)}
    </div>
  );
}
```

Render the same number of skeletons as the page size so the layout height is stable.

## Shared state components

`src/components/ui/states.tsx`
```tsx
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface StateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center py-16 text-center", className)}>
      {icon && <div className="mb-4 text-zinc-400">{icon}</div>}
      <h3 className="text-base font-medium text-zinc-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-600">{description}</p>}
      {action && (
        <Button className="mt-6" asChild={!!action.href} onClick={action.onClick}>
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Không tải được dữ liệu",
  description = "Có thể do kết nối mạng. Bạn thử lại nhé.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={onRetry ? { label: "Thử lại", onClick: onRetry } : undefined}
    />
  );
}
```

## The standard shape of a data screen

```tsx
"use client";

export function FavoritesList() {
  const { data, isPending, isError, refetch } = useFavorites();

  if (isPending) return <RoomGridSkeleton count={6} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-10 w-10" />}
        title="Chưa có phòng nào được lưu"
        description="Bấm biểu tượng trái tim trên tin đăng để lưu lại xem sau."
        action={{ label: "Tìm phòng ngay", href: "/" }}
      />
    );
  }

  return <RoomGrid rooms={data} />;
}
```

Order matters: loading → error → empty → content. Checking `data.length` before
confirming `data` exists is a crash.

## Empty states must be specific

A generic "Không có dữ liệu" tells the user nothing. Name the situation and offer the way out:

| Screen | Title | Action |
|---|---|---|
| Search, no results | "Không tìm thấy phòng phù hợp" | "Xoá bớt bộ lọc" |
| Favorites | "Chưa có phòng nào được lưu" | "Tìm phòng ngay" |
| My listings | "Bạn chưa đăng tin nào" | "Đăng tin đầu tiên" |
| Saved searches | "Chưa lưu tìm kiếm nào" | "Tìm phòng ngay" |
| Admin moderation queue | "Không có tin nào chờ duyệt" | — (this one is good news, no action) |

Distinguish "no data yet" from "no results for this filter" — the first needs an
onboarding action, the second needs a way to loosen the filter.

## Errors by status code

```tsx
if (isError) {
  const status = error instanceof ApiError ? error.status : 0;

  if (status === 401) {
    return (
      <EmptyState
        title="Bạn cần đăng nhập"
        description="Đăng nhập để xem nội dung này."
        action={{ label: "Đăng nhập", href: `/login?next=${pathname}` }}
      />
    );
  }
  if (status === 403) {
    return <EmptyState title="Bạn không có quyền xem nội dung này" />;
  }
  if (status === 404) return notFound();

  return <ErrorState onRetry={() => refetch()} />;
}
```

Never render `error.message` straight from the API — backend messages are in English
and written for developers.

## Mutations: pending, not just success

```tsx
<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
</Button>
```

Every mutation disables its trigger while pending — otherwise a double click posts the
listing twice. Confirm with a toast, and for destructive actions confirm **before** acting:

```tsx
<Dialog>
  <DialogContent>
    <DialogTitle>Xoá tin đăng này?</DialogTitle>
    <DialogDescription>Tin sẽ không còn hiển thị với người thuê. Không thể hoàn tác.</DialogDescription>
    …
  </DialogContent>
</Dialog>
```

## Pagination

The backend returns `{ rooms, total, page, pageSize }`. Keep the page in the URL
(`nuqs`) so results stay shareable, and reset to page 1 whenever a filter changes —
otherwise a narrower filter lands the user on an empty page 5.

While loading the next page, keep showing the current results with reduced opacity
rather than replacing them with skeletons; React Query's `placeholderData: keepPreviousData`
does this and avoids the layout collapsing on every page change.

## Do NOT
- Render a bare spinner on a blank page instead of a skeleton.
- Show "Không có dữ liệu" without saying what to do next.
- Surface a raw backend error message.
- Check `data.length` before checking `isPending`.
- Leave a mutation button enabled while it is in flight.
- Skip the 401/403 branch — "Đã có lỗi xảy ra" for a signed-out user is a dead end.

## Checklist
- [ ] All four states handled: loading, error, empty, denied
- [ ] Skeleton matches the real layout and count
- [ ] Empty state names the situation and offers an action
- [ ] 401 → sign-in prompt, 403 → permission message, 404 → `notFound()`
- [ ] Mutation buttons disabled while pending, with a label change
- [ ] Destructive actions confirmed first
- [ ] Page resets to 1 on filter change
