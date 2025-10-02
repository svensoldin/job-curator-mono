'use client';

import { useState } from 'react';

interface JobPreferences {
  jobTitle: string;
  location: string;
  salaryExpectation: string;
}

type Step = 'jobTitle' | 'location' | 'salary' | 'complete';

export default function AIPage() {
  const [currentStep, setCurrentStep] = useState<Step>('jobTitle');
  const [preferences, setPreferences] = useState<JobPreferences>({
    jobTitle: '',
    location: '',
    salaryExpectation: '',
  });
  const [inputValue, setInputValue] = useState('');

  const handleNext = () => {
    if (currentStep === 'jobTitle') {
      setPreferences((prev) => ({ ...prev, jobTitle: inputValue }));
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      setPreferences((prev) => ({ ...prev, location: inputValue }));
      setCurrentStep('salary');
    } else if (currentStep === 'salary') {
      setPreferences((prev) => ({ ...prev, salaryExpectation: inputValue }));
      setCurrentStep('complete');
    }
    setInputValue('');
  };

  const handleBack = () => {
    if (currentStep === 'location') {
      setCurrentStep('jobTitle');
      setInputValue(preferences.jobTitle);
    } else if (currentStep === 'salary') {
      setCurrentStep('location');
      setInputValue(preferences.location);
    } else if (currentStep === 'complete') {
      setCurrentStep('salary');
      setInputValue(preferences.salaryExpectation);
    }
  };

  const handleRestart = () => {
    setCurrentStep('jobTitle');
    setPreferences({
      jobTitle: '',
      location: '',
      salaryExpectation: '',
    });
    setInputValue('');
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'jobTitle':
        return 1;
      case 'location':
        return 2;
      case 'salary':
        return 3;
      case 'complete':
        return 4;
      default:
        return 1;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'jobTitle':
        return 'What job title are you looking for?';
      case 'location':
        return 'Where would you like to work?';
      case 'salary':
        return 'What is your salary expectation?';
      case 'complete':
        return 'Perfect! Here are your preferences:';
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (currentStep) {
      case 'jobTitle':
        return 'e.g., Fullstack Developer, Data Scientist, Product Manager...';
      case 'location':
        return 'e.g., Paris, Remote, London, Berlin...';
      case 'salary':
        return 'e.g., 45, 60, 80...';
      default:
        return '';
    }
  };

  const isStepValid = () => {
    return inputValue.trim().length > 0;
  };

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-12'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            AI Job Matcher
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Tell us what you're looking for and we'll find the perfect matches
          </p>
        </div>

        {/* Progress Bar */}
        <div className='mb-12'>
          <div className='flex items-center justify-center mb-4'>
            <div className='flex items-center space-x-4'>
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className='flex items-center'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step <= getStepNumber()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-8 h-0.5 mx-2 transition-colors ${
                        step < getStepNumber()
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className='text-center text-sm text-gray-500 dark:text-gray-400'>
            Step {getStepNumber()} of 4
          </p>
        </div>

        {/* Main Content */}
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center'>
              {getStepTitle()}
            </h2>

            {currentStep !== 'complete' ? (
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <input
                    type='text'
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    className='w-full p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isStepValid()) {
                        handleNext();
                      }
                    }}
                    autoFocus
                  />
                  {currentStep === 'salary' && (
                    <p className='text-sm text-gray-500 dark:text-gray-400 ml-2'>
                      Amount in thousands of euros (k€)
                    </p>
                  )}
                </div>

                <div className='flex justify-between space-x-4'>
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 'jobTitle'}
                    className='px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
                  >
                    {currentStep === 'salary' ? 'Complete' : 'Next'}
                  </button>
                </div>
              </div>
            ) : (
              <div className='space-y-6'>
                <div className='space-y-4'>
                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                    <div className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>
                      Job Title
                    </div>
                    <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                      {preferences.jobTitle}
                    </div>
                  </div>

                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                    <div className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>
                      Location
                    </div>
                    <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                      {preferences.location}
                    </div>
                  </div>

                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                    <div className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>
                      Salary Expectation
                    </div>
                    <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                      {preferences.salaryExpectation}k€
                    </div>
                  </div>
                </div>

                <div className='flex justify-center space-x-4'>
                  <button
                    onClick={handleBack}
                    className='px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleRestart}
                    className='px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                  >
                    Start Over
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Submit to AI matching service
                      alert('AI matching will be implemented here!');
                    }}
                    className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
                  >
                    Find Matches
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {currentStep !== 'complete' && (
          <div className='max-w-2xl mx-auto mt-8'>
            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
              <div className='flex items-start space-x-3'>
                <div className='flex-shrink-0'>
                  <svg
                    className='w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-1'>
                    Tips for better matches
                  </h3>
                  <p className='text-sm text-blue-700 dark:text-blue-300'>
                    {currentStep === 'jobTitle' &&
                      'Be specific about your role: "Senior React Developer" works better than just "Developer"'}
                    {currentStep === 'location' &&
                      'You can specify multiple locations or "Remote" for remote work opportunities'}
                    {currentStep === 'salary' &&
                      'Consider your experience level and market rates for your location and role'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
