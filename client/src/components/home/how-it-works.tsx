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
      <ScrollReveal className="mb-5 lg:mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Cách <span className="text-brand-700">Trọ Ơi</span> hoạt động
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
          Tìm phòng rõ ràng hơn qua ba bước đơn giản.
        </p>
      </ScrollReveal>

      <div className="grid gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-zinc-200">
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <ScrollReveal
            key={title}
            delay={index * 120}
            className="flex gap-4 md:block md:px-8 md:first:pl-0 md:last:pr-0"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 md:mx-auto">
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
