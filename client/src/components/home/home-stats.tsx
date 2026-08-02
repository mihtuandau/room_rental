'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Building2, MapPinned, WalletCards } from 'lucide-react';

function AnimatedValue({ value }: { value: string }) {
  const numericMatch = value.match(/\d+/);
  const target = numericMatch ? parseInt(numericMatch[0], 10) : null;
  const [displayValue, setDisplayValue] = useState(
    target !== null && target > 0 ? '0' : value,
  );

  useEffect(() => {
    if (target === null || target <= 0) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1200;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easedProgress * target);

      const updatedString = value.replace(
        /\d+/,
        current.toLocaleString('vi-VN'),
      );
      setDisplayValue(updatedString);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, target]);

  return <>{displayValue}</>;
}

export function HomeStats({ totalRooms }: { totalRooms: number }) {
  const stats = [
    {
      icon: Building2,
      value: totalRooms.toLocaleString('vi-VN'),
      label: 'tin đăng đang hoạt động',
    },
    { icon: MapPinned, value: '63', label: 'tỉnh, thành phố' },
    { icon: BadgeCheck, value: 'Đã xác minh', label: 'quy trình kiểm duyệt' },
    { icon: WalletCards, value: '0 ₫', label: 'phí đăng tin' },
  ];

  return (
    <section
      aria-label="Thống kê Trọ Ơi"
      className="border-y border-zinc-200 bg-white"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-4 py-6 sm:px-6 lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }, index) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-3 py-4 sm:justify-center ${
              index % 2 === 1 ? 'border-l border-zinc-200' : ''
            } ${index >= 2 ? 'border-t border-zinc-200 lg:border-t-0' : ''} ${
              index > 0 ? 'lg:border-l lg:border-zinc-200' : 'lg:border-l-0'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <strong className="block text-base font-semibold text-zinc-900">
                <AnimatedValue value={value} />
              </strong>
              <span className="block text-xs text-zinc-500">{label}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
