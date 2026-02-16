'use client';

import { Button } from '@/components/ui';

interface StepFormNavigationProps {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  isLastInput: boolean;
  isValid: boolean;
}

export const StepFormNavigation = ({
  onBack,
  onNext,
  canGoBack,
  isLastInput,
  isValid,
}: StepFormNavigationProps) => (
  <div className='flex justify-between space-x-4'>
    <Button onClick={onBack} disabled={!canGoBack} variant='secondary' size='md'>
      Back
    </Button>
    <Button onClick={onNext} disabled={!isValid} variant='primary' size='md' className='px-8'>
      {isLastInput ? 'Complete' : 'Next'}
    </Button>
  </div>
);
