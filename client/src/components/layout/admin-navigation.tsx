"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
              "flex min-h-10 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              active
                ? "bg-brand-600 font-medium text-white"
                : "text-zinc-700 hover:bg-white",
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
