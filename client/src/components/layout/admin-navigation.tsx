"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: UsersRound },
  { href: "/admin/rooms/pending", label: "Duyệt tin", icon: ClipboardCheck },
  { href: "/admin/reports", label: "Báo cáo", icon: FileWarning },
  { href: "/admin/amenities", label: "Tiện ích", icon: Settings },
] as const;

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const current =
    pathname.startsWith("/admin/account")
      ? { label: "Tài khoản" }
      : (ADMIN_NAV_ITEMS.find((item) => pathname.startsWith(item.href)) ??
        ADMIN_NAV_ITEMS[0]);

  return (
    <nav
      aria-label="Đường dẫn trang quản trị"
      className="flex min-w-0 items-center gap-2 text-sm"
    >
      <Link
        href="/admin/dashboard"
        className="hidden shrink-0 rounded-md text-zinc-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:inline-flex"
      >
        Quản trị
      </Link>
      <ChevronRight
        className="hidden h-4 w-4 shrink-0 text-zinc-400 sm:block"
        aria-hidden
      />
      <span
        className="truncate font-medium text-zinc-900"
        aria-current="page"
      >
        {current.label}
      </span>
    </nav>
  );
}

export function AdminNavLinks({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Quản trị" className={cn("space-y-1", className)}>
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
              active
                ? "border-brand-600 bg-brand-50 font-medium text-brand-800"
                : "text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
