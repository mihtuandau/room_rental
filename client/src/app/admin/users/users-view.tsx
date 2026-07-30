"use client";

import { FormEvent, useState } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  FilterX,
  LockKeyhole,
  Search,
  ShieldAlert,
  UnlockKeyhole,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser } from "@/features/admin/api";
import {
  useAdminUsers,
  useBanAdminUser,
  useExportAdminUsers,
  useUnbanAdminUser,
} from "@/features/admin/hooks";
import {
  AdminMetricCard,
  AdminPageHeader,
  adminStickyActionCellClassName,
  adminStickyActionHeadClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from "@/components/admin/admin-page";

const PAGE_SIZE = 20;
const ROLE_VALUES = ["user", "admin"] as const;
const LISTING_VALUES = ["none", "any", "active"] as const;
const STATUS_VALUES = ["active", "banned"] as const;
const ROLE_LABELS = {
  user: "Người dùng",
  admin: "Quản trị viên",
} as const;
const LISTING_LABELS = {
  none: "Chưa có tin đăng",
  any: "Đã có tin đăng",
  active: "Có tin đang hoạt động",
} as const;
const STATUS_LABELS = { active: "Đang hoạt động", banned: "Đã khóa" } as const;

const userParsers = {
  keyword: parseAsString.withDefault(""),
  role: parseAsStringLiteral(ROLE_VALUES),
  listing: parseAsStringLiteral(LISTING_VALUES),
  status: parseAsStringLiteral(STATUS_VALUES),
  page: parseAsInteger.withDefault(1),
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function AdminUsersView() {
  const [state, setState] = useQueryStates(userParsers, {
    history: "push",
    shallow: true,
  });
  const [keywordInput, setKeywordInput] = useState(state.keyword);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const filters = {
    keyword: state.keyword || undefined,
    role: state.role ?? undefined,
    listing: state.listing ?? undefined,
    status: state.status ?? undefined,
  };
  const users = useAdminUsers({
    ...filters,
    page: state.page,
    pageSize: PAGE_SIZE,
  });
  const ban = useBanAdminUser();
  const unban = useUnbanAdminUser();
  const exportUsers = useExportAdminUsers();

  const applyKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void setState({ keyword: keywordInput.trim(), page: 1 });
  };
  const setFilter = (key: "role" | "listing" | "status", value: string) => {
    void setState({ [key]: value === "all" ? null : value, page: 1 });
  };
  const clearFilters = () => {
    setKeywordInput("");
    void setState({
      keyword: "",
      role: null,
      listing: null,
      status: null,
      page: 1,
    });
  };
  const exportCsv = async () => {
    const result = await exportUsers.mutateAsync({
      ...filters,
      page: 1,
      pageSize: 10_000,
    });
    downloadCsv(result.users);
    toast.success(
      result.truncated
        ? "Đã xuất 10.000 tài khoản đầu tiên."
        : `Đã xuất ${result.total} tài khoản.`,
    );
  };

  if (users.isPending && !users.data) return <UsersSkeleton />;
  if (users.isError) return <ErrorState onRetry={() => void users.refetch()} />;
  if (!users.data) return null;

  const { data } = users;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasFilters = Boolean(
    state.keyword || state.role || state.listing || state.status,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Người dùng"
        description="Quản lý tài khoản, trạng thái xác minh và quyền truy cập nền tảng."
        action={
          <Button
            variant="outline"
            onClick={() => void exportCsv()}
            disabled={exportUsers.isPending || data.total === 0}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportUsers.isPending ? "Đang xuất…" : "Xuất CSV"}
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <AdminMetricCard
          label="Tổng kết quả"
          value={data.total.toLocaleString("vi-VN")}
          detail="Theo bộ lọc hiện tại"
          icon={UsersRound}
          tone="brand"
        />
        <AdminMetricCard
          label="Đang hoạt động"
          value={data.summary.active.toLocaleString("vi-VN")}
          detail="Theo từ khóa và vai trò"
          icon={BadgeCheck}
          tone="brand"
        />
        <AdminMetricCard
          label="Chưa xác minh"
          value={data.summary.unverified.toLocaleString("vi-VN")}
          detail="Trong nhóm đang xem"
          icon={CircleAlert}
          tone="warning"
        />
        <AdminMetricCard
          label="Tài khoản đã khóa"
          value={data.summary.banned.toLocaleString("vi-VN")}
          detail="Theo từ khóa và vai trò"
          icon={ShieldAlert}
          tone="danger"
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Danh sách tài khoản
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Tìm kiếm theo tên, số điện thoại hoặc email.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FilterX className="h-4 w-4" aria-hidden />
                  Xóa bộ lọc
                </Button>
              )}
              {users.isPlaceholderData && (
                <span className="text-xs text-zinc-500">Đang cập nhật…</span>
              )}
            </div>
          </div>

          <form
            onSubmit={applyKeyword}
            className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_150px_190px_170px_auto]"
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <Input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="Tìm theo tên, số điện thoại hoặc email"
                className="pl-9"
              />
            </div>
            <Select
              value={state.role ?? "all"}
              onValueChange={(value) => setFilter("role", value)}
            >
              <SelectTrigger aria-label="Lọc theo loại tài khoản">
                <SelectValue placeholder="Mọi tài khoản" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi tài khoản</SelectItem>
                {ROLE_VALUES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.listing ?? "all"}
              onValueChange={(value) => setFilter("listing", value)}
            >
              <SelectTrigger aria-label="Lọc theo hoạt động đăng tin">
                <SelectValue placeholder="Mọi hoạt động đăng tin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi hoạt động đăng tin</SelectItem>
                {LISTING_VALUES.map((listing) => (
                  <SelectItem key={listing} value={listing}>
                    {LISTING_LABELS[listing]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.status ?? "all"}
              onValueChange={(value) => setFilter("status", value)}
            >
              <SelectTrigger aria-label="Lọc theo trạng thái">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {STATUS_VALUES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Tìm</Button>
          </form>
        </div>

        {data.users.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="h-10 w-10" />}
            title="Không tìm thấy tài khoản phù hợp"
            description="Thử thay đổi từ khóa hoặc xóa bớt điều kiện lọc."
            action={
              hasFilters
                ? { label: "Xóa bộ lọc", onClick: clearFilters }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <p className="px-4 pb-2 text-xs text-zinc-500 md:hidden">
              Vuốt ngang để xem đầy đủ thông tin.
            </p>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className={adminTableHeadClassName}>
                <tr>
                  <th className="hidden px-4 py-3 lg:table-cell">
                    Mã người dùng
                  </th>
                  <th className="px-4 py-3 sm:px-5">Thông tin người dùng</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Tài khoản & tin đăng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Tham gia</th>
                  <th
                    className={`${adminStickyActionHeadClassName} px-4 py-3 sm:px-5`}
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody
                className={users.isPlaceholderData ? "opacity-60" : undefined}
              >
                {data.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onBan={() => setSelectedUser(user)}
                    onUnban={() => void unban.mutateAsync(user.id)}
                    isUnbanning={unban.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.total > 0 && (
          <Pagination
            page={data.page}
            totalPages={totalPages}
            onPage={(page) => void setState({ page })}
          />
        )}
      </section>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open && !ban.isPending) setSelectedUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản này?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-zinc-600">
              {selectedUser?.fullName || selectedUser?.phone || "Tài khoản này"}{" "}
              sẽ không thể đăng nhập và toàn bộ phiên hiện tại sẽ bị thu hồi.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedUser(null)}
              disabled={ban.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              disabled={!selectedUser || ban.isPending}
              onClick={() => {
                if (selectedUser)
                  void ban
                    .mutateAsync(selectedUser.id)
                    .then(() => setSelectedUser(null));
              }}
            >
              <LockKeyhole className="h-4 w-4" aria-hidden />
              {ban.isPending ? "Đang khóa…" : "Khóa tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserRow({
  user,
  onBan,
  onUnban,
  isUnbanning,
}: {
  user: AdminUser;
  onBan: () => void;
  onUnban: () => void;
  isUnbanning: boolean;
}) {
  return (
    <tr className={adminTableRowClassName}>
      <td className="hidden px-4 py-4 lg:table-cell">
        <div className="flex items-center gap-2">
          <code
            className="text-xs text-zinc-600"
            title={user.id}
          >
            …{user.id.slice(-6)}
          </code>
          <button
            type="button"
            aria-label={`Sao chép mã người dùng của ${user.fullName || "tài khoản này"}`}
            title="Sao chép mã đầy đủ"
            onClick={() => void copyUserId(user.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </td>
      <td className="px-4 py-4 sm:px-5">
        <p className="font-medium text-zinc-900">
          {user.fullName || "Chưa cập nhật tên"}
        </p>
      </td>
      <td className="px-4 py-4 text-zinc-600">
        {user.phone || "Chưa có số điện thoại"}
      </td>
      <td className="px-4 py-4">
        <AccountActivity user={user} />
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1.5">
          {user.deletedAt ? (
            <Badge variant="danger">Đã khóa</Badge>
          ) : (
            <Badge variant="verified">Đang hoạt động</Badge>
          )}
          <p
            className={
              user.isPhoneVerified
                ? "flex items-center gap-1 text-xs text-brand-700"
                : "flex items-center gap-1 text-xs text-zinc-500"
            }
          >
            <span
              className={
                user.isPhoneVerified
                  ? "h-1.5 w-1.5 rounded-full bg-brand-600"
                  : "h-1.5 w-1.5 rounded-full bg-zinc-400"
              }
            />
            {user.isPhoneVerified ? "Đã xác minh" : "Chưa xác minh"}
          </p>
        </div>
      </td>
      <td className="px-4 py-4 text-zinc-600">{formatDate(user.createdAt)}</td>
      <td className={`${adminStickyActionCellClassName} px-4 py-4 sm:px-5`}>
        {user.role === "admin" ? (
          <span className="text-xs text-zinc-400">Tài khoản quản trị</span>
        ) : user.deletedAt ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isUnbanning}
            onClick={onUnban}
          >
            <UnlockKeyhole className="h-4 w-4" aria-hidden />
            {isUnbanning ? "Đang mở khóa…" : "Mở khóa"}
          </Button>
        ) : (
          <Button variant="danger" size="sm" onClick={onBan}>
            <LockKeyhole className="h-4 w-4" aria-hidden />
            Khóa
          </Button>
        )}
      </td>
    </tr>
  );
}

async function copyUserId(userId: string) {
  try {
    await navigator.clipboard.writeText(userId);
    toast.success("Đã sao chép mã người dùng.");
  } catch {
    toast.error("Không thể sao chép mã. Hãy thử lại.");
  }
}

function AccountActivity({ user }: { user: AdminUser }) {
  return (
    <div className="space-y-1.5">
      <Badge variant={user.role === "admin" ? "verified" : "neutral"}>
        {ROLE_LABELS[user.role]}
      </Badge>
      {user.role === "user" ? (
        <p className="text-xs text-zinc-500">
          {user.hasActiveListing
            ? "Có tin đang hoạt động"
            : user.listingCount > 0
              ? `${user.listingCount.toLocaleString("vi-VN")} tin đăng`
              : "Chưa có tin đăng"}
        </p>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Phân trang người dùng"
      className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 sm:px-5"
    >
      <p className="text-xs text-zinc-500">
        Trang {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Trang trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Trang sau
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

function downloadCsv(users: AdminUser[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const safe = (value: string) =>
    /^[=+\-@]/.test(value) ? `'${value}` : value;
  const rows = users.map((user) =>
    [
      user.fullName || "",
      user.phone || "",
      ROLE_LABELS[user.role],
      String(user.listingCount),
      user.hasActiveListing ? "Có" : "Không",
      user.isPhoneVerified ? "Đã xác minh" : "Chưa xác minh",
      user.deletedAt ? "Đã khóa" : "Đang hoạt động",
      formatDate(user.createdAt),
    ]
      .map((value) => escape(safe(value)))
      .join(","),
  );
  const content = `\uFEFFTên,Số điện thoại,Loại tài khoản,Số tin đăng,Có tin hoạt động,Xác minh,Trạng thái,Ngày tham gia\n${rows.join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `tro-oi-nguoi-dung-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-3 h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <Skeleton className="h-20 w-full" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 border-b border-zinc-100 px-5 py-4"
          >
            <Skeleton className="h-10" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-9" />
          </div>
        ))}
      </div>
    </div>
  );
}
