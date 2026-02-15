'use client';

import { useState } from 'react';

import { UserCriteria } from '@/types/user-criteria';

import content from './data';
import { StepIndicator, StepForm, ReviewStep, TipCard, TaskStarted } from './_components';
import { useCreateNewTask } from './_lib/mutations';
import { Button } from '@/components/ui';
import Text from '@/components/ui/Text/Text';
import { useUser } from '@/context/UserContext';

export default function Search() {
  const user = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [criteria, setCriteria] = useState<UserCriteria>({
    jobTitle: '',
    location: '',
    skills: '',
    salary: '',
  });

  const { mutate, isPending, isError, error, isSuccess, data } = useCreateNewTask();

  const currentStepName = content[currentStep].key;

  const isLastStep = currentStepName === 'complete';

  const handleChange = (text: string) => {
    setCriteria((prev) => ({
      ...prev,
      [currentStepName]: text,
    }));
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStartOver = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    if (!isLastStep) return;
    const body = {
      ...criteria,
      userId: user.id,
    };
    mutate(body);
  };

  if (isPending) {
    return (
      <div className='min-h-screen bg-gray-900 transition-colors flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold text-white mb-2'>Starting Your Job Search...</h2>
          <Text>Setting up your search task</Text>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='min-h-screen bg-gray-900 transition-colors flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto'>
          <div className='text-red-600 mb-4'>
            <svg
              className='w-12 h-12 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-semibold text-white mb-2'>Job Search Failed</h2>
          <Text className='mb-6'>{error.message}</Text>
          <Button onClick={handleStartOver}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return <TaskStarted taskId={data.taskId} onStartOver={handleStartOver} />;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-12'>
        <h1 className='text-3xl font-bold text-white mb-2'>AI Job Matcher</h1>
        <Text>Tell us what you're looking for and we'll find the perfect matches</Text>
      </div>

      <StepIndicator currentStep={currentStep + 1} totalSteps={content.length} />

      <div className='max-w-2xl mx-auto'>
        {currentStepName !== 'complete' ? (
          <StepForm
            currentStep={currentStep}
            value={criteria[currentStepName]}
            callbacks={{
              onChange: handleChange,
              onNext: handleNext,
              onBack: handleBack,
            }}
            canGoBack={currentStep > 0}
          />
        ) : (
          <ReviewStep
            preferences={criteria}
            onBack={handleBack}
            onStartOver={handleStartOver}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {currentStepName !== 'complete' && (
        <div className='max-w-2xl mx-auto mt-8'>
          <TipCard tip={content[currentStep]?.tip} />
        </div>
      )}
    </div>
  );
}
