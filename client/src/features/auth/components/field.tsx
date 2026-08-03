import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';

// InputProps.error is a boolean flag; the Field's error is the message string,
// so drop the boolean one and derive it from the message instead.
interface FieldProps extends Omit<InputProps, 'error'> {
  id: string;
  label: string;
  error?: string;
}

/**
 * Label + input + error in one place so every auth field is spaced and wired
 * for screen readers identically. Every field needs a real <label htmlFor> and
 * an autoComplete value — password managers and mobile keyboards rely on them.
 */
export function Field({ id, label, error, ...inputProps }: FieldProps) {
  const isPassword = inputProps.type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          {...inputProps}
          id={id}
          error={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={isPassword ? 'pr-10' : undefined}
          type={isPassword && visible ? 'text' : inputProps.type}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
