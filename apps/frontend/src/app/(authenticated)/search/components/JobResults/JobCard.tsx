'use client';

import { memo } from 'react';

interface JobCardProps {
  title: string;
  company: string;
  source: string;
  aiScore: number;
  description?: string;
  url: string;
}

export const JobCard = memo(function JobCard({
  title,
  company,
  source,
  aiScore,
  description,
  url,
}: JobCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            {title}
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>
            {company} • {source}
          </p>
        </div>
        <div className='text-right'>
          <div className={`text-3xl font-bold ${getScoreColor(aiScore)}`}>
            {aiScore || 'N/A'}/100
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Match Score
          </div>
        </div>
      </div>

      <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4'>
        <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
          {description ? 'Job Description:' : 'No job description'}
        </h4>
        <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-3'>
          {description?.substring(0, 300)}...
        </p>
      </div>

      <a
        href={url}
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
  );
});
