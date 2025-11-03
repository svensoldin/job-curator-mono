'use client';

import React, { memo } from 'react';
import { Input, Button } from '@/components/ui';

interface StepFormProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastInput: boolean;
  helperText?: string;
}

// Memoize to prevent re-render when parent state changes but props don't
export const StepForm = memo(function StepForm({
  title,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  canGoBack,
  isLastInput,
  helperText,
}: StepFormProps) {
  const isValid = value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      onNext();
    }
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
      <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center'>
        {title}
      </h2>

      <div className='space-y-6'>
        <Input
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          helperText={helperText}
          onKeyDown={handleKeyDown}
          autoFocus
          className='text-lg'
        />

        <div className='flex justify-between space-x-4'>
          <Button
            onClick={onBack}
            disabled={!canGoBack}
            variant='ghost'
            size='md'
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!isValid}
            variant='primary'
            size='md'
            className='px-8'
          >
            {isLastInput ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
});
