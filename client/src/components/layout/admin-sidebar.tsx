"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminNavLinks } from "./admin-navigation";

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-100 md:flex md:flex-col md:justify-between md:py-6">
      <div className="space-y-8">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Quản trị Trọ Ơi
            </p>
            <p className="text-xs text-zinc-600">Khu vực quản trị</p>
          </div>
        </Link>

        <AdminNavLinks className="px-2" />
      </div>

      <div className="border-t border-zinc-200 px-4 pt-6 text-xs text-zinc-500">
        Trọ Ơi Admin
      </div>
    </aside>
  );
}
