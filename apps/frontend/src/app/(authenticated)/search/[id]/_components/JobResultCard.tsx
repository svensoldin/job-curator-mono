'use client';

import { Button } from '@/components/ui';
import Text from '@/components/ui/Text/Text';
import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

interface JobResultCardProps {
  id?: string | number;
  title: string;
  company?: string;
  source?: string;
  aiScore?: number | null;
  description?: string | null;
  url: string;
}

const JobResultCard = ({
  title,
  company,
  source,
  aiScore,
  description,
  url,
}: JobResultCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const scoreColor = (score?: number | null) => {
    if (score == null) return '';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className='rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl transition-shadow'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <h3 className='text-xl font-semibold text-white mb-1'>{title}</h3>
          <Text>
            {company} {company && source ? '•' : ''} {source}
          </Text>
        </div>
        {aiScore != null && (
          <div className='text-right ml-4'>
            <div className={clsx('text-3xl font-bold', scoreColor(aiScore))}>{aiScore}</div>
            <div className='text-sm text-gray-400'>Score</div>
          </div>
        )}
      </div>

      {description ? (
        <div className='bg-gray-800 p-4 rounded-lg mb-4'>
          <Text className='text-sm'>
            {isExpanded ? description : description.substring(0, 300)}
            {description.length > 300 ? '...' : ''}
            {description.length > 300 && (
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className='cursor-pointer ml-2'
              >
                See {isExpanded ? 'less' : 'more'}
              </button>
            )}
          </Text>
        </div>
      ) : null}

      <Link href={url} target='_blank' rel='noopener noreferrer'>
        <Button>
          View job posting
          <svg className='ml-2 w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
            />
          </svg>
        </Button>
      </Link>
    </div>
  );
};

export default JobResultCard;
