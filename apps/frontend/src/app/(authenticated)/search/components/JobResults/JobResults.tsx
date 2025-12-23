'use client';

import { memo } from 'react';
import { JobResultsHeader } from './JobResultsHeader';
import { JobResultsEmpty } from './JobResultsEmpty';
import { JobCard } from './JobCard';

interface Job {
  title: string;
  company: string;
  source: string;
  aiScore: number;
  description?: string;
  url: string;
}

interface JobResultsProps {
  totalJobs: number;
  jobs: Job[];
  onTryAgain: () => void;
}

export const JobResults = memo(function JobResults({
  totalJobs,
  jobs,
  onTryAgain,
}: JobResultsProps) {
  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <JobResultsHeader totalJobs={totalJobs} />

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
            {jobs.length === 0 ? (
              <JobResultsEmpty onTryAgain={onTryAgain} />
            ) : (
              jobs.map((job, index) => (
                <JobCard
                  key={index}
                  title={job.title}
                  company={job.company}
                  source={job.source}
                  aiScore={job.aiScore}
                  description={job.description}
                  url={job.url}
                />
              ))
            )}
          </div>

          <div className='text-center mt-8'>
            <button
              onClick={onTryAgain}
              className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              Search more jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
