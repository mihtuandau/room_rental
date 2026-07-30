"use client";

import {
  ChevronDown,
  House,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth/hooks";
import { useProfile } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AdminBreadcrumb, AdminNavLinks } from "./admin-navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminTopbar() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: profile } = useProfile();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="mr-2 shrink-0 md:hidden"
            aria-label="Mở điều hướng quản trị"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 h-dvh max-h-none w-[min(20rem,calc(100vw-3rem))] max-w-none translate-x-0 translate-y-0 rounded-none">
          <DialogHeader>
            <DialogTitle>Quản trị Trọ Ơi</DialogTitle>
          </DialogHeader>
          <AdminNavLinks
            className="overflow-y-auto p-3"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="min-w-0 flex-1">
        <AdminBreadcrumb />
      </div>

      <div className="ml-3 flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-2 text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label="Mở menu tài khoản quản trị"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
                {profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary image
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-4 w-4" aria-hidden />
                )}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                {profile?.fullName || "Quản trị viên"}
              </span>
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="border-b border-zinc-100 px-3 py-2">
              <p className="text-sm font-medium text-zinc-900">
                {profile?.fullName || "Quản trị viên"}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                <ShieldCheck className="h-3 w-3 text-brand-700" aria-hidden />
                Quản trị viên
              </p>
            </div>
            <DropdownMenuItem onSelect={() => router.push("/admin/account")}>
              <UserCog className="h-4 w-4" aria-hidden />
              Tài khoản cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/")}>
              <House className="h-4 w-4" aria-hidden />
              Xem trang chủ
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={logout.isPending}
              onSelect={() => {
                void logout.mutateAsync().then(() => {
                  router.push("/");
                  router.refresh();
                });
              }}
              className="mt-1 text-danger-600 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-600"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
