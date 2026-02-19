'use client';

import React, { memo } from 'react';

interface TipCardProps {
  tip: string;
}

export const TipCard = memo(function TipCard({ tip }: TipCardProps) {
  return (
    <div className='bg-blue-900/20 border border-blue-800 rounded-lg p-4'>
      <div className='flex items-start space-x-3'>
        <div className='shrink-0'>
          <svg className='w-5 h-5 text-blue-400 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div>
          <h3 className='text-sm font-medium text-blue-200 mb-1'>Tips for better matches</h3>
          <p className='text-sm text-blue-300'>{tip}</p>
        </div>
      </div>
    </div>
  );
});
