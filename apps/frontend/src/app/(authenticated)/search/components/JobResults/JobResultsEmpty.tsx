'use client';

import { memo } from 'react';

interface JobResultsEmptyProps {
  onTryAgain: () => void;
}

export const JobResultsEmpty = memo(function JobResultsEmpty({
  onTryAgain,
}: JobResultsEmptyProps) {
  return (
    <div className='text-center py-8'>
      <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
        No jobs found
      </h3>
      <p className='text-gray-600 dark:text-gray-400 mb-6'>
        Try adjusting your search criteria or location
      </p>
      <button
        onClick={onTryAgain}
        className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
      >
        Try Again
      </button>
    </div>
  );
});
