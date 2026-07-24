'use client';

import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/** A dual-handle range (or single-handle) slider — used for price/area filters. */
export function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  // One <Thumb> per value in the controlled/default array, so this works for
  // both a single handle and a dual-range (min, max) slider.
  const thumbCount = (props.value ?? props.defaultValue ?? [0]).length;

  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-zinc-200">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-brand-600" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-5 w-5 rounded-full border-2 border-brand-600 bg-white shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
