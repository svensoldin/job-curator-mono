'use client';

import { JobSearchWithStats } from '@/types/database';

interface SearchCardProps {
  search: JobSearchWithStats;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function SearchCard({
  search,
  onClick,
  onDelete,
}: SearchCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={onClick}
      className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all'
    >
      <div className='flex items-start justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white flex-1'>
          {search.job_title}
        </h3>
        <button
          onClick={onDelete}
          className='text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors'
          title='Delete search'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
            />
          </svg>
        </button>
      </div>

      <div className='space-y-2 mb-4'>
        <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
          <svg
            className='w-4 h-4 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
          {search.location}
        </div>
        <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
          <svg
            className='w-4 h-4 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          {search.salary}k€
        </div>
      </div>

      <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {search.result_count}
            </div>
            <div className='text-xs text-gray-500 dark:text-gray-400'>
              Results
            </div>
          </div>
          {search.avg_ai_score && (
            <div>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {Math.round(search.avg_ai_score)}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Avg Score
              </div>
            </div>
          )}
          <div className='text-right'>
            <div className='text-xs text-gray-500 dark:text-gray-400'>
              {formatDate(search.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
