import React from 'react';

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
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 border ${
          error
            ? 'border-red-300 dark:border-red-600 focus:ring-red-600'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-600'
        } rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        {...props}
      />
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-2">{helperText}</p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2 ml-2">{error}</p>}
    </div>
  );
}
