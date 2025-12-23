'use client';

import { memo } from 'react';

interface JobResultsHeaderProps {
  totalJobs: number;
}

export const JobResultsHeader = memo(function JobResultsHeader({
  totalJobs,
}: JobResultsHeaderProps) {
  return (
    <div className='text-center mb-8'>
      <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
        Job Search Complete! 🎉
      </h1>
      <p className='text-gray-600 dark:text-gray-400'>
        Found {totalJobs} jobs ranked by AI match score
      </p>
    </div>
  );
});
