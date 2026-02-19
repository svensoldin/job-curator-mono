import clsx from 'clsx';
import { Label } from 'radix-ui';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <Label.Root htmlFor={inputId} className="block text-sm font-medium text-gray-100 mb-2">
          {label}
        </Label.Root>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-4 py-3 border rounded-lg bg-black text-gray-200 placeholder-gray-400 transition-colors',
          'focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-300 focus:ring-red-600' : 'border-gray-300 focus:ring-gray-100'
        )}
        {...props}
      />
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-2">{helperText}</p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2 ml-2">{error}</p>}
    </div>
  );
}
