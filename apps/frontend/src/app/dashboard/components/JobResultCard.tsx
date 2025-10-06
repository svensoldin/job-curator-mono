'use client';

import { JobResult } from '@/types/database';

interface JobResultCardProps {
  job: JobResult;
}

export default function JobResultCard({ job }: JobResultCardProps) {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-1'>
            {job.title}
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>
            {job.company} • {job.source}
          </p>
        </div>
        {job.ai_score !== null && (
          <div className='text-right ml-4'>
            <div
              className={`text-3xl font-bold ${
                job.ai_score >= 80
                  ? 'text-green-600'
                  : job.ai_score >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {job.ai_score}
            </div>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Score
            </div>
          </div>
        )}
      </div>

      {job.description ? (
        <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4'>
          <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-3'>
            {job.description.substring(0, 300)}...
          </p>
        </div>
      ) : null}

      <a
        href={job.url}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
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
  );
}
