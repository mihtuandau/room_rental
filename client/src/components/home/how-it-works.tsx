import { PhoneCall, Search, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const STEPS = [
  {
    icon: Search,
    title: 'Chọn nơi bạn muốn ở',
    description: 'Lọc theo khu vực, mức giá và tiện ích phù hợp với nhu cầu của bạn.',
  },
  {
    icon: ShieldCheck,
    title: 'Kiểm tra tin đăng',
    description: 'Xem ảnh, vị trí, trạng thái xác minh và thời gian cập nhật trước khi liên hệ.',
  },
  {
    icon: PhoneCall,
    title: 'Liên hệ an toàn',
    description: 'Kết nối trực tiếp với người đăng và luôn xem phòng trước khi đặt cọc.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <ScrollReveal className="mb-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Cách <span className="text-brand-700">Trọ Ơi</span> hoạt động
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
          Tìm phòng rõ ràng hơn qua ba bước đơn giản.
        </p>
      </ScrollReveal>

      <div className="grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <ScrollReveal
            key={title}
            delay={index * 120}
            className="group relative flex flex-col items-start gap-4 rounded-xl border border-border-subtle bg-surface-card p-5 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-popover sm:p-6"
          >
            <span className="absolute right-5 top-5 font-heading text-4xl font-bold leading-none text-zinc-100 transition-colors duration-200 group-hover:text-brand-100 sm:text-5xl">
              {index + 1}
            </span>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-100">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-zinc-900 sm:text-lg">
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
