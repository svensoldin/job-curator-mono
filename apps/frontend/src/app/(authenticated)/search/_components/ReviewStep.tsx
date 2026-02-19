'use client';

import React, { memo } from 'react';
import { UserCriteria } from '@/types/user-criteria';
import { Button, Card } from '@/components/ui';

interface ReviewStepProps {
  preferences: UserCriteria;
  onBack: () => void;
  onStartOver: () => void;
  onSubmit: () => void;
}

export const ReviewStep = ({ preferences, onBack, onStartOver, onSubmit }: ReviewStepProps) => (
  <Card padding='lg'>
    <h2 className='text-2xl font-semibold text-white mb-8 text-center'>
      Review Your Search Criteria
    </h2>

    <div className='space-y-4 mb-8'>
      <ReviewField label='Job Title' value={preferences.jobTitle} />
      <ReviewField label='Location' value={preferences.location} />
      <ReviewField label='Skills' value={preferences.skills} />
      <ReviewField label='Salary Expectation' value={`${preferences.salary}k€`} />
    </div>

    <div className='flex justify-center space-x-4'>
      <Button onClick={onBack} size='md'>
        Edit
      </Button>
      <Button onClick={onStartOver} variant='secondary' size='md'>
        Start Over
      </Button>
      <Button onClick={onSubmit} variant='primary' size='md' className='px-8'>
        Search Jobs
      </Button>
    </div>
  </Card>
);

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-gray-700 p-4 rounded-lg'>
      <div className='text-sm font-medium text-gray-400 mb-1'>{label}</div>
      <div className='text-lg font-semibold text-white'>{value}</div>
    </div>
  );
}
