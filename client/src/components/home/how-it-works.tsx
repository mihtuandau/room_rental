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
      <ScrollReveal className="mb-6 lg:mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Cách <span className="text-brand-700">Trọ Ơi</span> hoạt động
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
          Tìm phòng rõ ràng hơn qua ba bước đơn giản.
        </p>
      </ScrollReveal>

      <div className="relative grid gap-4 md:grid-cols-3 md:gap-8">
        <div
          className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-7 hidden border-t border-dashed border-brand-200 md:block"
          aria-hidden="true"
        />
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <ScrollReveal
            key={title}
            delay={index * 120}
            className="relative flex gap-4 py-2 md:block md:text-center"
          >
            <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-4 ring-white md:mx-auto">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div className="pt-1 md:pt-5">
              <p className="text-xs font-semibold text-brand-700">
                Bước {index + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-900 sm:text-lg">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                {description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
