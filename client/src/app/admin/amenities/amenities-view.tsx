"use client";

import { FormEvent, useMemo, useState } from "react";
import { parseAsString } from "nuqs/server";
import { useQueryState } from "nuqs";
import {
  AirVent,
  Armchair,
  ArrowUpRight,
  Bath,
  BarChart3,
  Building2,
  Camera,
  Hospital,
  Pencil,
  PawPrint,
  Plus,
  Power,
  Refrigerator,
  School,
  Search,
  ShieldCheck,
  SquareParking,
  Store,
  Tags,
  Trash2,
  TriangleAlert,
  WashingMachine,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAmenities,
  useCreateAdminAmenity,
  useDeleteAdminAmenity,
  useUpdateAdminAmenity,
} from "@/features/admin/hooks";
import type { Amenity } from "@/features/amenities/api";
import type { AmenityType } from "@/lib/constants";
import {
  AdminMetricCard,
  AdminPageHeader,
  adminTableHeadClassName,
  adminTableRowClassName,
} from "@/components/admin/admin-page";

const TYPES: AmenityType[] = ["basic", "utility", "security", "nearby"];
const labels: Record<AmenityType, string> = {
  basic: "Cơ bản",
  utility: "Tiện nghi",
  security: "An ninh",
  nearby: "Xung quanh",
};
const ICON_OPTIONS = ["wifi", "ac", "water-heater", "fridge", "balcony", "furniture", "pet", "washing-machine", "elevator", "parking", "shield", "camera", "market", "school", "hospital"];
type Values = { name: string; type: AmenityType; icon?: string; description?: string; isActive?: boolean };

function AmenitySymbol({ icon }: { icon: string | null }) {
  const isEmoji = Boolean(icon && /\p{Extended_Pictographic}/u.test(icon));
  const Icon = {
    wifi: Wifi,
    ac: AirVent,
    "water-heater": Bath,
    fridge: Refrigerator,
    balcony: Building2,
    furniture: Armchair,
    pet: PawPrint,
    "washing-machine": WashingMachine,
    elevator: ArrowUpRight,
    parking: SquareParking,
    shield: ShieldCheck,
    camera: Camera,
    market: Store,
    school: School,
    hospital: Hospital,
  }[icon ?? ""];

  return isEmoji ? (
    <>{icon}</>
  ) : Icon ? (
    <Icon className="h-5 w-5 text-brand-700" />
  ) : (
    <Tags className="h-5 w-5 text-brand-700" />
  );
}

export function AdminAmenitiesView() {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [input, setInput] = useState(query);
  const [typeFilter, setTypeFilter] = useState<AmenityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sort, setSort] = useState<"name" | "usage">("name");
  const [form, setForm] = useState<Amenity | "new" | null>(null);
  const [target, setTarget] = useState<Amenity | null>(null);
  const amenities = useAdminAmenities();
  const create = useCreateAdminAmenity();
  const update = useUpdateAdminAmenity();
  const remove = useDeleteAdminAmenity();
  const items = useMemo(
    () =>
      (amenities.data ?? [])
        .filter(
          (x) =>
            `${x.name} ${labels[x.type]}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (typeFilter === "all" || x.type === typeFilter) &&
            (statusFilter === "all" ||
              (statusFilter === "active" ? x.isActive : !x.isActive)),
        )
        .sort((a, b) =>
          sort === "usage"
            ? (b._count?.rooms ?? 0) - (a._count?.rooms ?? 0)
            : a.name.localeCompare(b.name, "vi"),
        ),
    [amenities.data, query, typeFilter, statusFilter, sort],
  );
  const summary = {
    total: amenities.data?.length ?? 0,
    active: amenities.data?.filter((item) => item.isActive).length ?? 0,
    used:
      amenities.data?.reduce(
        (sum, item) => sum + (item._count?.rooms ?? 0),
        0,
      ) ?? 0,
  };
  const save = (value: Values) => {
    if (form === "new")
      void create.mutateAsync(value).then(() => setForm(null));
    if (form && form !== "new")
      void update
        .mutateAsync({ id: form.id, ...value })
        .then(() => setForm(null));
  };
  if (amenities.isPending)
    return <Skeleton className="h-[620px] w-full rounded-lg" />;
  if (amenities.isError)
    return <ErrorState onRetry={() => void amenities.refetch()} />;
  return (
    <div className="amenity-console space-y-6">
      <AdminPageHeader
        title="Quản lý tiện ích"
        description="Chuẩn hóa các tiện ích hiển thị trên tin đăng."
        action={<Button onClick={() => setForm("new")}>
          <Plus className="h-4 w-4" />
          Thêm tiện ích
        </Button>}
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard
          label="Tổng tiện ích"
          value={summary.total.toLocaleString("vi-VN")}
          detail="Trong catalogue"
          icon={Tags}
          tone="brand"
        />
        <AdminMetricCard
          label="Đang hoạt động"
          value={summary.active.toLocaleString("vi-VN")}
          detail={`${summary.total - summary.active} tiện ích đã tắt`}
          icon={Power}
          tone="brand"
        />
        <AdminMetricCard
          label="Lượt gắn tin"
          value={summary.used.toLocaleString("vi-VN")}
          detail="Trên tất cả tin đăng"
          icon={BarChart3}
          tone="neutral"
        />
      </section>
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4 sm:p-5">
          <form
            className="grid w-full gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_150px_190px]"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void setQuery(input.trim());
            }}
          >
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                className="pl-9"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tìm theo tên tiện ích…"
              />
            </div>
            <Button className="hidden" variant="outline" type="submit">
              Tìm
            </Button>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as AmenityType | "all")
              }
            >
              <SelectTrigger aria-label="Lọc theo danh mục">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {labels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger aria-label="Lọc theo trạng thái">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as "name" | "usage")}
            >
              <SelectTrigger aria-label="Sắp xếp tiện ích">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên A–Z</SelectItem>
                <SelectItem value="usage">Dùng nhiều nhất</SelectItem>
              </SelectContent>
            </Select>
          </form>
        </div>
        {items.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-10 w-10" />}
            title="Không tìm thấy tiện ích"
            description="Thử một từ khóa khác hoặc thêm tiện ích mới."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className={adminTableHeadClassName}>
                <tr>
                  <th className="px-5 py-3">Tiện ích</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Tin sử dụng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Mã catalogue</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={adminTableRowClassName}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm">
                          <AmenitySymbol icon={item.icon} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="neutral"
                        className="bg-zinc-100 px-3 py-1"
                      >
                        {labels[item.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-700">
                      {item._count?.rooms ?? 0} tin đăng
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.isActive}
                          aria-label={`Đổi trạng thái ${item.name}`}
                          disabled={update.isPending}
                          onClick={() =>
                            void update.mutateAsync({
                              id: item.id,
                              isActive: !item.isActive,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${item.isActive ? "bg-brand-600" : "bg-zinc-300"}`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${item.isActive ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                        <span
                          className={
                            item.isActive
                              ? "text-xs font-medium text-brand-700"
                              : "text-xs font-medium text-zinc-500"
                          }
                        >
                          {item.isActive ? "Bật" : "Tắt"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-zinc-500">
                      {item.slug}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Sửa"
                          onClick={() => setForm(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-danger-600 hover:bg-danger-50"
                          aria-label="Xóa"
                          onClick={() => setTarget(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-zinc-900">Quy chuẩn catalogue</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Tên tiện ích nên ngắn gọn, dễ nhận diện và dùng biểu tượng nhất
            quán. Điều này giúp người thuê so sánh các tin đăng nhanh hơn.
          </p>
        </article>
        <article className="flex flex-col justify-between rounded-lg border border-brand-100 bg-brand-50/70 p-4 sm:p-5">
          <div>
            <h2 className="font-semibold text-brand-800">Mẹo quản trị</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              Kiểm tra ảnh hưởng trước khi xóa vì tiện ích sẽ biến mất khỏi tất
              cả tin đăng liên quan.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
            Xem hướng dẫn <ArrowUpRight className="h-4 w-4" />
          </span>
        </article>
      </section>
      <AmenityForm
        item={form}
        loading={create.isPending || update.isPending}
        onClose={() => setForm(null)}
        onSave={save}
      />
      <DeleteDialog
        item={target}
        pending={remove.isPending}
        onClose={() => setTarget(null)}
        onDelete={() =>
          target &&
          void remove.mutateAsync(target.id).then(() => setTarget(null))
        }
      />
    </div>
  );
}

function AmenityForm({
  item,
  loading,
  onClose,
  onSave,
}: {
  item: Amenity | "new" | null;
  loading: boolean;
  onClose: () => void;
  onSave: (v: Values) => void;
}) {
  const data = item && item !== "new" ? item : null;
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [type, setType] = useState<AmenityType>("basic");
  return (
    <Dialog open={item !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl overflow-hidden"
        onOpenAutoFocus={() => {
          setName(data?.name ?? "");
          setIcon(data?.icon ?? "");
          setDescription(data?.description ?? "");
          setIsActive(data?.isActive ?? true);
          setType(data?.type ?? "basic");
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {data ? "Chỉnh sửa tiện ích" : "Thêm tiện ích mới"}
          </DialogTitle>
          <p className="mt-1 text-sm text-zinc-600">Cập nhật thông tin tiện ích cho hệ thống Trọ Ơi.</p>
        </DialogHeader>
        <DialogBody className="grid gap-x-6 gap-y-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(180px,1fr)]">
          <label className="block text-sm font-medium text-zinc-800">
            Tên tiện ích
            <Input
              className="mt-2 h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            <span className="block">Danh mục</span>
            <Select
              value={type}
              onValueChange={(v) => setType(v as AmenityType)}
            >
              <SelectTrigger className="mt-2 h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {labels[x]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <section className="border-t border-zinc-100 pt-5 sm:col-span-2"><p className="text-sm font-medium text-zinc-800">Chọn biểu tượng</p><p className="mt-1 text-xs text-zinc-500">Biểu tượng giúp người thuê nhận diện tiện ích nhanh hơn.</p><div className="mt-3 grid grid-cols-5 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-10">{ICON_OPTIONS.map((value) => <button key={value} type="button" aria-label={value} onClick={() => setIcon(value)} className={`flex h-11 items-center justify-center rounded-md border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${icon === value ? "border-brand-600" : "border-transparent hover:border-brand-300"}`}><AmenitySymbol icon={value} /></button>)}</div></section>
          <label className="border-t border-zinc-100 pt-5 text-sm font-medium text-zinc-800 sm:col-span-2">Mô tả tiện ích<Textarea className="mt-2 min-h-24 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả chi tiết về tiện ích này..." /></label>
          <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/50 p-4 sm:col-span-2"><div><p className="text-sm font-medium text-zinc-900">Hiển thị trên tin đăng</p><p className="mt-1 text-xs text-zinc-500">Tắt tùy chọn này để tạm ẩn tiện ích khỏi catalogue công khai.</p></div><button type="button" role="switch" aria-checked={isActive} aria-label="Hiển thị tiện ích trên tin đăng" onClick={() => setIsActive((value) => !value)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${isActive ? "bg-brand-600" : "bg-zinc-300"}`}><span className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} /></button></div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!name.trim() || loading}
            onClick={() =>
              onSave({
                name: name.trim(),
                type,
                ...(icon.trim() ? { icon: icon.trim() } : {}),
                ...(description.trim() ? { description: description.trim() } : {}),
                isActive,
              })
            }
          >
            {loading ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function DeleteDialog({
  item,
  pending,
  onClose,
  onDelete,
}: {
  item: Amenity | null;
  pending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa tiện ích?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex gap-3 rounded-lg bg-warning-50 p-4 text-sm leading-6 text-zinc-700">
            <TriangleAlert className="h-5 w-5 shrink-0 text-warning-600" />“
            {item?.name}” sẽ bị gỡ khỏi catalogue và mọi tin đăng liên quan.
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" disabled={pending} onClick={onDelete}>
            {pending ? "Đang xóa…" : "Xóa tiện ích"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
