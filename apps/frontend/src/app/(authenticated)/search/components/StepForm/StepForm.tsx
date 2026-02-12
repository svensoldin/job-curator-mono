'use client';

import { memo } from 'react';
import { StepFormInput } from './StepFormInput';
import { StepFormNavigation } from './StepFormNavigation';
import content from '../../data';

export interface StepFormCallbacks {
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface StepFormProps {
  currentStep: number;
  value: string;
  callbacks: StepFormCallbacks;
  canGoBack: boolean;
}

export const StepForm = memo(function StepForm({
  currentStep,
  value,
  callbacks,
  canGoBack,
}: StepFormProps) {
  const isValid = value.trim().length > 0;
  const stepConfig = content[currentStep];
  const currentStepName = stepConfig.key;
  const isLastInput = currentStepName === 'salary';
  const helperText = isLastInput ? 'Amount in thousands of euros (k€)' : undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
        {stepConfig.title}
      </h2>

      <div className="space-y-6">
        <StepFormInput
          value={value}
          onChange={callbacks.onChange}
          placeholder={stepConfig.placeholder}
          helperText={helperText}
          onNext={callbacks.onNext}
        />

        <StepFormNavigation
          onBack={callbacks.onBack}
          onNext={callbacks.onNext}
          canGoBack={canGoBack}
          isLastInput={isLastInput}
          isValid={isValid}
        />
      </div>
    </div>
  );
});
