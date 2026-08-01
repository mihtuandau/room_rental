import { BadgeCheck, CircleDollarSign, RefreshCcw } from 'lucide-react';

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Tin đăng rõ ràng',
    description:
      'Thông tin và hình ảnh được kiểm tra trước khi tin đăng hiển thị công khai.',
  },
  {
    icon: CircleDollarSign,
    title: 'Liên hệ trực tiếp',
    description:
      'Bạn trao đổi trực tiếp với chủ trọ, không phát sinh phí xem phòng từ Trọ Ơi.',
  },
  {
    icon: RefreshCcw,
    title: 'Thông tin được cập nhật',
    description:
      'Trạng thái tin đăng được cập nhật để bạn hạn chế mất thời gian với phòng đã cho thuê.',
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold">Vì sao chọn Trọ Ơi?</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Một trải nghiệm tìm phòng đơn giản, minh bạch và đáng tin cậy hơn.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {REASONS.map(({ icon: Icon, title, description }) => (
          <article key={title} className="border-t border-zinc-200 pt-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-medium text-zinc-900">{title}</h3>
            <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-600">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
