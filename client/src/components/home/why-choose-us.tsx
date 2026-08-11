import {
  BadgeCheck,
  CircleDollarSign,
  RefreshCcw,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

/* ─── Data ─────────────────────────────────────────────────────────── */
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

/* ─── Component ─────────────────────────────────────────────────────── */
export function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <ScrollReveal className="mb-5 lg:mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Vì sao chọn <span className="text-brand-700">Trọ Ơi?</span>
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
          Trải nghiệm tìm phòng đơn giản, minh bạch và an tâm hơn mỗi ngày.
        </p>
      </ScrollReveal>
      
      <div className="grid gap-6 md:grid-cols-3 md:gap-0">
        {REASONS.map(({ icon: Icon, title, description }, i) => (
          <ScrollReveal
            key={title}
            delay={i * 150}
            className="group flex gap-4 md:border-l md:border-zinc-200 md:px-7 first:md:border-l-0 first:md:pl-0 last:md:pr-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors duration-200 group-hover:bg-brand-100">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 lg:text-xl">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                {description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
