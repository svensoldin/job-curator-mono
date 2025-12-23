'use client';

import { memo } from 'react';
import Link from 'next/link';
import { DASHBOARD } from '@/routes';

interface TaskStartedProps {
  taskId: string;
  onStartOver: () => void;
}

export const TaskStarted = memo(function TaskStarted({
  taskId,
  onStartOver,
}: TaskStartedProps) {
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
            <strong>Task ID:</strong> {taskId}
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
            onClick={onStartOver}
            className='px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium'
          >
            Start Another Search
          </button>
        </div>
      </div>
    </div>
  );
});
