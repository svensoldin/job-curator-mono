'use client';

import { ChangeEvent, useState } from 'react';
import { UserCriteria } from '../../types/user-criteria';
import { SearchApiResponse } from './api/route';

import content from './data';
import { DASHBOARD, SEARCH_API } from '@/routes';
import Link from 'next/link';

export default function Search() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserCriteria>({
    jobTitle: '',
    location: '',
    skills: '',
    salary: '',
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskStarted, setTaskStarted] = useState<{
    searchId: string;
    taskId: string;
  } | null>(null);

  const currentStepName = content[currentStep].key;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.target.value;
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
    setResults(null);
    setError(null);
    setIsLoading(false);
    setTaskStarted(null);
  };

  const getStepNumber = () => {
    return currentStep + 1;
  };

  const isStepValid = () => {
    if (!isLastStep) return preferences[currentStepName].length > 0;
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

      if (data.pending) {
        setTaskStarted({ searchId: data.searchId, taskId: data.taskId });
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            Starting Your Job Search...
          </h2>
          <p className='text-gray-600 dark:text-gray-400'>
            Setting up your search task
          </p>
        </div>
      </div>
    );
  }

  if (taskStarted) {
    return (
      <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center'>
        <div className='text-center max-w-2xl mx-auto px-4'>
          <div className='mb-6'>
            <svg
              className='w-16 h-16 mx-auto text-green-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
            Search Task Started! 🚀
          </h2>
          <p className='text-lg text-gray-600 dark:text-gray-400 mb-8'>
            Your job search is now running in the background. We're scraping job
            boards and analyzing matches for you.
          </p>
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8'>
            <p className='text-sm text-gray-700 dark:text-gray-300 mb-2'>
              <strong>Task ID:</strong> {taskStarted.taskId}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              This usually takes 5-10 minutes. You can safely leave this page.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={DASHBOARD}
              className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center'
            >
              Go to Dashboard
              <svg
                className='ml-2 w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 7l5 5m0 0l-5 5m5-5H6'
                />
              </svg>
            </Link>
            <button
              onClick={handleStartOver}
              className='px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium'
            >
              Start Another Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                Job Search Complete! 🎉
              </h1>
              <p className='text-gray-600 dark:text-gray-400'>
                Found {results.totalJobs} jobs ranked by AI match score
              </p>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
              {results.analyzedJobs.length === 0 ? (
                <div className='text-center py-8'>
                  <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                    No jobs found
                  </h3>
                  <p className='text-gray-600 dark:text-gray-400 mb-6'>
                    Try adjusting your search criteria or location
                  </p>
                  <button
                    onClick={handleStartOver}
                    className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                results.analyzedJobs.map((job: any, index: number) => (
                  <div key={index} className='mb-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                          {job.title}
                        </h3>
                        <p className='text-gray-600 dark:text-gray-400'>
                          {job.company} • {job.source}
                        </p>
                      </div>
                      <div className='text-right'>
                        <div
                          className={`text-3xl font-bold ${
                            job.aiScore >= 80
                              ? 'text-green-600'
                              : job.aiScore >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {job.aiScore || 'N/A'}/100
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          Match Score
                        </div>
                      </div>
                    </div>

                    <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4'>
                      <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                        {job.description
                          ? 'Job Description:'
                          : 'No job description'}
                      </h4>
                      <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-3'>
                        {job.description?.substring(0, 300)}...
                      </p>
                    </div>

                    <a
                      href={job.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                      View Job Posting
                      <svg
                        className='ml-2 w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                        />
                      </svg>
                    </a>
                  </div>
                ))
              )}
            </div>

            <div className='text-center mt-8'>
              <button
                onClick={handleStartOver}
                className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
              >
                Search more jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center'>
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
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            Job Search Failed
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>{error}</p>
          <button
            onClick={handleStartOver}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

        <div className='mb-12'>
          <div className='flex items-center justify-center mb-4'>
            <div className='flex items-center space-x-4'>
              {[1, 2, 3, 4, 5].map((step) => (
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
                  {step < 5 && (
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
            Step {getStepNumber()} of 5
          </p>
        </div>

        {/* Main Content */}
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center'>
              {content[currentStep].title}
            </h2>

            {currentStepName !== 'complete' ? (
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <input
                    type='text'
                    value={preferences[currentStepName]}
                    onChange={handleChange}
                    placeholder={content[currentStep].placeholder}
                    className='w-full p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isStepValid()) {
                        handleNext();
                      }
                    }}
                    autoFocus
                  />
                  {currentStepName === 'salary' && (
                    <p className='text-sm text-gray-500 dark:text-gray-400 ml-2'>
                      Amount in thousands of euros (k€)
                    </p>
                  )}
                </div>

                <div className='flex justify-between space-x-4'>
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className='px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
                  >
                    {currentStepName === 'salary' ? 'Complete' : 'Next'}
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
                      Skills
                    </div>
                    <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                      {preferences.skills}
                    </div>
                  </div>

                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                    <div className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>
                      Salary Expectation
                    </div>
                    <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                      {preferences.salary}k€
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
                    onClick={handleStartOver}
                    className='px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleSubmit}
                    className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
                    type='submit'
                  >
                    Search Jobs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {currentStepName !== 'complete' && (
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
                    {content[currentStep]?.tip}
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
