import { ArrowUpRight } from 'lucide-react';

export function AmenitiesGuidance() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold text-zinc-900">
          Quy chuẩn catalogue
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Tên tiện ích nên ngắn gọn, dễ nhận diện và dùng biểu tượng nhất quán.
          Điều này giúp người thuê so sánh các tin đăng nhanh hơn.
        </p>
      </article>
      <article className="flex flex-col justify-between rounded-lg border border-brand-100 bg-brand-50/70 p-4 sm:p-5">
        <div>
          <h2 className="font-semibold text-brand-800">Mẹo quản trị</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Kiểm tra ảnh hưởng trước khi xóa vì tiện ích sẽ biến mất khỏi tất cả
            tin đăng liên quan.
          </p>
        </div>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
          Xem hướng dẫn <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </article>
    </section>
  );
}
