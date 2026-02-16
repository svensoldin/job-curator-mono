'use client';

import { Input } from '@/components/ui';

interface StepFormInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helperText?: string;
  onNext: () => void;
}

export const StepFormInput = ({
  value,
  onChange,
  placeholder,
  helperText,
  onNext,
}: StepFormInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim().length > 0) {
      onNext();
    }
  };

  return (
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
  );
};
