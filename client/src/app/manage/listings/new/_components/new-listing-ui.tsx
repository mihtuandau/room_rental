'use client';

import { Check } from 'lucide-react';
import {
  Controller,
  type Control,
} from 'react-hook-form';
import { cn, formatPrice } from '@/lib/utils';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import type {
  CreateRoomFormInput,
  CreateRoomFormOutput,
} from '@/features/rooms/schemas';

export const LISTING_STEPS = [
  'Thông tin chính',
  'Vị trí',
  'Chi tiết và tiện ích',
  'Hình ảnh và xem lại',
] as const;

export function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 sm:justify-start">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="truncate font-medium text-zinc-900 sm:ml-auto">{value}</dd>
    </div>
  );
}

export function CurrencyField({
  control,
  name,
  id,
  label,
  placeholder,
  error,
}: {
  control: Control<CreateRoomFormInput, unknown, CreateRoomFormOutput>;
  name: 'price' | 'deposit';
  id: string;
  label: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <label htmlFor={id} className="mb-1 block text-sm font-medium">
            {label}
          </label>
          <div className="relative">
            <input
              id={id}
              ref={field.ref}
              name={field.name}
              inputMode="numeric"
              autoComplete="off"
              value={formatCurrencyInput(field.value)}
              onBlur={field.onBlur}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '');
                field.onChange(digits === '' ? '' : Number(digits));
              }}
              placeholder={placeholder}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? `${id}-error` : `${id}-suffix`}
              className={cn(
                'h-10 w-full rounded-md border bg-white px-3 pr-10 text-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
                error
                  ? 'border-danger-600 focus:ring-danger-600'
                  : 'border-zinc-300 focus:border-brand-600 focus:ring-brand-600',
              )}
            />
            <span
              id={`${id}-suffix`}
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-500"
            >
              ₫
            </span>
          </div>
          {error ? (
            <p id={`${id}-error`} className="mt-1 text-sm text-danger-600">
              {error}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

export function ListingPreview({
  step,
  title,
  roomType,
  price,
  area,
  city,
  district,
  amenityCount,
  imageCount,
}: {
  step: number;
  title?: string;
  roomType?: CreateRoomFormInput['roomType'];
  price: number;
  area: number;
  city?: string;
  district?: string;
  amenityCount: number;
  imageCount: number;
}) {
  return (
    <aside className="sticky top-24 hidden space-y-4 lg:block">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Xem trước tin
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-zinc-950">
          {title || 'Tiêu đề tin đăng của bạn'}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          {roomType ? ROOM_TYPE_LABELS[roomType] : 'Chưa chọn loại hình'}
        </p>
        <p className="mt-4 text-xl font-semibold text-brand-700">
          {price > 0 ? `${formatPrice(price)}/tháng` : 'Chưa nhập giá'}
        </p>
        <dl className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm">
          <ReviewRow label="Diện tích" value={area > 0 ? `${area} m²` : '—'} />
          <ReviewRow
            label="Vị trí"
            value={[district, city].filter(Boolean).join(', ') || '—'}
          />
          <ReviewRow label="Tiện ích" value={`${amenityCount} mục`} />
          <ReviewRow label="Hình ảnh" value={`${imageCount} ảnh`} />
        </dl>
      </div>
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-sm font-medium text-brand-900">
          Đang hoàn thành bước {step + 1}/{LISTING_STEPS.length}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{
              width: `${((step + 1) / LISTING_STEPS.length) * 100}%`,
            }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-brand-800">
          Thông tin rõ ràng và ảnh thật giúp tin được duyệt nhanh hơn.
        </p>
      </div>
    </aside>
  );
}

export function ListingStepper({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Bước {current + 1}/{LISTING_STEPS.length}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-900">
              {LISTING_STEPS[current]}
            </p>
          </div>
          <span className="text-sm text-zinc-500">
            {Math.round(((current + 1) / LISTING_STEPS.length) * 100)}%
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{
              width: `${((current + 1) / LISTING_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="relative hidden px-5 sm:block">
        <div
          className="absolute left-10 right-10 top-5 h-0.5 bg-zinc-200"
          aria-hidden
        />
        <ol className="relative grid grid-cols-4">
          {LISTING_STEPS.map((label, index) => {
            const state =
              index < current
                ? 'done'
                : index === current
                  ? 'current'
                  : 'upcoming';
            return (
              <li
                key={label}
                className="flex min-w-0 flex-col items-center gap-2 px-2 text-center"
              >
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  disabled={index > current}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                    state === 'upcoming'
                      ? 'bg-zinc-200 text-zinc-600'
                      : 'bg-brand-600 text-white',
                  )}
                >
                  {state === 'done' ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </button>
                <span
                  className={cn(
                    'text-xs font-medium md:text-sm',
                    state === 'current'
                      ? 'text-brand-700'
                      : state === 'done'
                        ? 'text-zinc-700'
                        : 'text-zinc-500',
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

function formatCurrencyInput(value: unknown) {
  if (value === '' || value === undefined || value === null) return '';
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return '';
  return new Intl.NumberFormat('vi-VN').format(numberValue);
}
