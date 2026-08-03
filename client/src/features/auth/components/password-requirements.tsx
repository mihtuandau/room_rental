import { Check, X } from 'lucide-react';

const rules = [
  { label: 'Tối thiểu 8 ký tự', test: (value: string) => value.length >= 8 },
  { label: 'Có ít nhất một chữ hoa', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Có ít nhất một chữ thường', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Có ít nhất một chữ số', test: (value: string) => /\d/.test(value) },
];

export function PasswordRequirements({ value }: { value: string }) {
  const isComplete = rules.every((rule) => rule.test(value));
  if (!value || isComplete) return null;

  return (
    <div className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2" aria-live="polite">
      {rules.map((rule) => {
        const valid = rule.test(value);
        return (
          <p key={rule.label} className={valid ? 'flex items-center gap-1.5 text-brand-700' : 'flex items-center gap-1.5 text-danger-600'}>
            {valid ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
            {rule.label}
          </p>
        );
      })}
    </div>
  );
}
