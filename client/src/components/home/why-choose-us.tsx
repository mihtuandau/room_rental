import {
  BadgeCheck,
  CircleDollarSign,
  RefreshCcw,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────────────── */
const REASONS = [
  {
    icon: BadgeCheck,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    title: 'Tin đăng rõ ràng',
    description:
      'Thông tin và hình ảnh được kiểm tra kỹ trước khi hiển thị công khai. Không lo tin ảo.',
  },
  {
    icon: CircleDollarSign,
    bg: 'bg-brand-50',
    text: 'text-brand-700',
    title: 'Liên hệ trực tiếp',
    description:
      'Trao đổi thẳng với chủ trọ, không qua môi giới. Không phát sinh phí xem phòng từ Trọ Ơi.',
  },
  {
    icon: RefreshCcw,
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    title: 'Cập nhật liên tục',
    description:
      'Trạng thái phòng được đồng bộ thường xuyên, giúp bạn tránh mất thời gian với phòng đã có người.',
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────────── */
export function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Vì sao chọn <span className="text-brand-700">Trọ Ơi?</span>
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
          Tìm phòng đơn giản, minh bạch và an tâm hơn mỗi ngày.
        </p>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-white">
        <div className="relative px-6 py-8 sm:px-10 sm:py-9">
          {/* Reasons cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {REASONS.map(({ icon: Icon, bg, text, title, description }) => (
              <article
                key={title}
                className="group relative overflow-hidden p-0 transition-colors duration-200"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${text} transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>

                <h3 className="mt-4 text-base font-semibold text-zinc-900">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
