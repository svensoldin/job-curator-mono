'use client';

import { useState } from 'react';

import { UserCriteria } from '@/types/user-criteria';
import { SEARCH_API } from '@/constants/routes';

import { SearchApiResponse } from './api/route';
import content from './data';
import { StepIndicator, StepForm, ReviewStep, TipCard, TaskStarted } from './components';

export default function Search() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserCriteria>({
    jobTitle: '',
    location: '',
    skills: '',
    salary: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskStarted, setTaskStarted] = useState<{
    searchId: string;
    taskId: string;
  } | null>(null);

  const currentStepName = content[currentStep].key;

  const handleChange = (text: string) => {
    setPreferences((prev) => ({
      ...prev,
      [currentStepName]: text,
    }));
  };

  const isLastStep = currentStepName === 'complete';

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setError(null);
    setIsLoading(false);
    setTaskStarted(null);
  };

  const handleSubmit = async () => {
    if (!isLastStep) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to start job search');
      }

      const data: SearchApiResponse = await response.json();
      setTaskStarted({ searchId: data.searchId, taskId: data.taskId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Starting Your Job Search...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Setting up your search task</p>
        </div>
      </div>
    );
  }

  if (taskStarted) {
    return <TaskStarted taskId={taskStarted.taskId} onStartOver={handleStartOver} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Job Search Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleStartOver}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Job Matcher</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us what you're looking for and we'll find the perfect matches
          </p>
        </div>

        <StepIndicator currentStep={currentStep + 1} totalSteps={content.length} />

        <div className="max-w-2xl mx-auto">
          {currentStepName !== 'complete' ? (
            <StepForm
              currentStep={currentStep}
              value={preferences[currentStepName]}
              callbacks={{
                onChange: handleChange,
                onNext: handleNext,
                onBack: handleBack,
              }}
              canGoBack={currentStep > 0}
            />
          ) : (
            <ReviewStep
              preferences={preferences}
              onBack={handleBack}
              onStartOver={handleStartOver}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {currentStepName !== 'complete' && (
          <div className="max-w-2xl mx-auto mt-8">
            <TipCard tip={content[currentStep]?.tip} />
          </div>
        )}
      </div>
    </div>
  );
}
