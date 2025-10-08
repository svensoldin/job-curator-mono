import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  href?: string;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600',
  secondary:
    'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600',
  outline:
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
  ghost:
    'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  href,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = isLoading ? (
    <>
      <svg
        className='animate-spin -ml-1 mr-3 h-5 w-5'
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
      >
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        ></circle>
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        ></path>
      </svg>
      Loading...
    </>
  ) : (
    children
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {content}
    </button>
  );
}
