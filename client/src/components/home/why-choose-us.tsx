import {
  BadgeCheck,
  CircleDollarSign,
  RefreshCcw,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Tin đăng rõ ràng',
    description:
      'Thông tin và hình ảnh được kiểm tra trước khi hiển thị công khai.',
  },
  {
    icon: CircleDollarSign,
    title: 'Liên hệ trực tiếp',
    description:
      'Kết nối trực tiếp với chủ trọ, không qua môi giới.',
  },
  {
    icon: RefreshCcw,
    title: 'Cập nhật liên tục',
    description:
      'Biết tin còn trống để không mất thời gian với phòng đã cho thuê.',
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <ScrollReveal>
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50/60 via-surface-subtle to-surface-card p-6 sm:p-8 lg:p-10">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Vì sao chọn <span className="text-brand-700">Trọ Ơi?</span>
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
            Trải nghiệm tìm phòng đơn giản, minh bạch và an tâm.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-6">
            {REASONS.map(({ icon: Icon, title, description }, i) => (
              <ScrollReveal
                key={title}
                delay={i * 120}
                className={`group flex gap-4 rounded-xl bg-surface-card p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-popover ${
                  i === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-1' : ''
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-100">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-zinc-900 lg:text-lg">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                    {description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
