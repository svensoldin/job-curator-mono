'use client';

import { useEffect } from 'react';

interface Job {
  description: string;
  title: string;
  url: string;
  company: string;
  score: number;
  source: string;
}

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onHideJob?: (jobUrl: string) => void;
}

export default function JobModal({
  isOpen,
  onClose,
  job,
  onHideJob,
}: JobModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !job) return null;

  const handleHideJob = () => {
    if (job.url && onHideJob) {
      onHideJob(job.url);
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div
        className='fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div className='relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
              {job.title}
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
              <div>
                <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>
                  Company
                </h3>
                <p className='text-lg font-medium text-gray-900 dark:text-white'>
                  {job.company}
                </p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-1'>
                  Match Score
                </h3>
                <p className='text-lg font-medium text-blue-600 dark:text-blue-400'>
                  {job.score}
                </p>
              </div>
            </div>

            <div className='mb-6'>
              <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                Job Description
              </h3>
              <div className='prose prose-sm max-w-none'>
                <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {job.description}
                </p>
              </div>
            </div>

            {job.url && (
              <div className='mb-6'>
                <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2'>
                  Job URL
                </h3>
                <a
                  href={job.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all'
                >
                  {job.url}
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
            <button
              onClick={handleHideJob}
              className='px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600/50 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
            >
              Hide this job
            </button>
            <div className='flex gap-3'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'
              >
                Close
              </button>
              {job.url && (
                <a
                  href={job.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors'
                >
                  View Job Posting
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
