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
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        error={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
