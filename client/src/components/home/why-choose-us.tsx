import {
  BadgeCheck,
  CircleDollarSign,
  RefreshCcw,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Tin đăng rõ ràng',
    description: 'Thông tin được kiểm tra rõ ràng.',
  },
  {
    icon: CircleDollarSign,
    title: 'Liên hệ trực tiếp',
    description: 'Kết nối trực tiếp với chủ trọ.',
  },
  {
    icon: RefreshCcw,
    title: 'Cập nhật liên tục',
    description: 'Tin mới được cập nhật thường xuyên.',
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <ScrollReveal>
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50/60 via-surface-subtle to-surface-card px-6 py-8 sm:px-10 sm:py-10 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12 lg:py-12">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Vì sao chọn <span className="text-brand-700">Trọ Ơi?</span>
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
              Trải nghiệm tìm phòng đơn giản, minh bạch và an tâm.
            </p>
          </div>

          <div className="mt-8 space-y-0 divide-y divide-border-subtle lg:mt-0">
            {REASONS.map(({ icon: Icon, title, description }, i) => (
              <ScrollReveal
                key={title}
                delay={i * 120}
                className="group flex items-start gap-4 py-5 first:pt-0 last:pb-0"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-100">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-zinc-900">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
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
