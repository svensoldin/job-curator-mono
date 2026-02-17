import clsx from 'clsx';

import { formatDate } from '@/helpers';

interface SearchCardProps {
  title: string;
  location?: string | null;
  salary?: string | null;
  createdAt?: string | null;
  isPending?: boolean;
}

const SearchCard = ({ title, location, salary, createdAt, isPending = false }: SearchCardProps) => (
  <div
    className={clsx(
      'rounded-lg shadow-sm p-6 transition-all relative shadow-gray-800 hover:-translate-y-1',
      isPending
        ? 'bg-blue-900/10 border-2 border-blue-500 animate-pulse-slow'
        : 'bg-neutral-950 border border-gray-800 hover:shadow-sm hover:border-blue-400'
    )}
  >
    {isPending && (
      <div className='absolute top-4 right-4 flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg'>
        <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
        <span>Processing</span>
      </div>
    )}

    <div className='flex items-start justify-between mb-4'>
      <h3 className='text-lg font-semibold text-white flex-1 pr-2'>{title}</h3>
    </div>

    <div className='space-y-2 mb-4'>
      <div className='flex items-center text-sm text-blue-400'>
        <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
        {location}
      </div>
      <div className='flex items-center text-sm text-gray-400'>
        <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        {salary ?? ''}
        {salary ? 'k€' : ''}
      </div>
    </div>

    <div className='pt-4 border-t border-gray-700'>
      {isPending ? (
        <div className='text-center py-2'>
          <p className='text-sm text-blue-400 font-medium'>
            ⏳ Searching job boards and analyzing results...
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            This usually takes only a minute.
          </p>
        </div>
      ) : (
        <div className='flex items-center justify-between'>
          <div className='text-right'>
            <div className='text-xs text-gray-400'>{createdAt ? formatDate(createdAt) : null}</div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default SearchCard;
