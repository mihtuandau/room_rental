import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, letting later Tailwind classes win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 2500000 -> "2.500.000 ₫" */
export function formatPrice(vnd: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(vnd);
}

/** 2500000 -> "2,5 triệu" — for tight spaces like listing cards */
export function formatPriceShort(vnd: number) {
  if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toLocaleString('vi-VN')} tỷ`;
  if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toLocaleString('vi-VN')} triệu`;
  if (vnd >= 1_000) return `${(vnd / 1_000).toLocaleString('vi-VN')} nghìn`;
  return `${vnd} ₫`;
}
