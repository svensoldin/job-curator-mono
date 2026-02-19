import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

import LoadingIcon from './LoadingIcon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  href?: string;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-white text-black hover:bg-gray-200 focus:ring-gray-200',
  secondary: 'bg-neutral-950 text-white hover:bg-neutral-900 focus:ring-neutral-900',
  // outline:
  //   'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
  // ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
  // danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  href,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = clsx(
    'font-semibold cursor-pointer rounded-lg transition-all duration-200 inline-flex items-center justify-center',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = isLoading ? <LoadingIcon /> : children;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || isLoading} aria-busy={isLoading} {...props}>
      {content}
    </button>
  );
}
