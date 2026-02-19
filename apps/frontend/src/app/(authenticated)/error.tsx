'use client';
import { useEffect } from 'react';

import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

const Error = ({ error, reset }: ErrorBoundaryProps) => {
  useEffect(() => {
    // Surface the error to developer logs
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='w-full max-w-2xl mx-auto border rounded-2xl p-8 shadow-lg backdrop-blur-md flex items-center justify-center'>
        <div className='flex items-start gap-6'>
          <div className='flex-1'>
            <h1 className='text-3xl font-semibold mb-2'>We're sorry — something went wrong</h1>
            <div className='rounded-md bg-slate-900/40 border border-slate-700/30 p-3 mb-4'>
              <p className='text-sm text-slate-400'>Error</p>
              <pre className='mt-1 text-xs font-mono text-slate-200 truncate'>
                {error?.message ?? 'Unexpected error'}
              </pre>
            </div>
            <div className='flex'>
              <Button onClick={() => reset()} aria-label='Try again'>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;
