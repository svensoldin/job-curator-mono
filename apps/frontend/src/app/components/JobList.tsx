'use client';

import { useState, useEffect } from 'react';
import cx from 'classnames';

import JobModal from './JobModal';

interface Job {
  description: string;
  title: string;
  url: string;
  company: string;
  score: number;
  source: string;
}

interface JobListProps {
  jobs: Job[];
}

const getBadgeColor = (score: number) => {
  if (score > 70) return 'bg-green-600';
  if (score > 50) return 'bg-green-400';
  if (score > 30) return 'bg-orange-600';
  return 'bg-red-600';
};

export default function JobList({ jobs }: JobListProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hiddenJobs, setHiddenJobs] = useState<string[]>([]);
  const [sourceSortOrder, setSourceSortOrder] = useState<'asc' | 'desc' | null>(
    null
  );

  // Load hidden jobs from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('hiddenJobs');
    if (stored) {
      try {
        setHiddenJobs(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing hidden jobs from localStorage:', error);
      }
    }
  }, []);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleHideJob = (jobUrl: string) => {
    const newHiddenJobs = [...hiddenJobs, jobUrl];
    setHiddenJobs(newHiddenJobs);
    localStorage.setItem('hiddenJobs', JSON.stringify(newHiddenJobs));
  };

  const handleSourceSort = () => {
    if (sourceSortOrder === null) {
      setSourceSortOrder('asc');
    } else if (sourceSortOrder === 'asc') {
      setSourceSortOrder('desc');
    } else {
      setSourceSortOrder(null);
    }
  };

  const getSortIcon = () => {
    if (sourceSortOrder === null) {
      return (
        <svg
          className='w-4 h-4 text-gray-400 dark:text-gray-500'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
          />
        </svg>
      );
    }
    return (
      <svg
        className={`w-4 h-4 text-blue-600 dark:text-blue-400`}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        {sourceSortOrder === 'asc' ? (
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5 15l7-7 7 7'
          />
        ) : (
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        )}
      </svg>
    );
  };

  // Filter out hidden jobs
  const visibleJobs = jobs.filter((job) => !hiddenJobs.includes(job.url));

  // Sort by source if sorting is active
  const sortedJobs =
    sourceSortOrder === null
      ? visibleJobs
      : [...visibleJobs].sort((a, b) => {
          const comparison = a.source
            .toLowerCase()
            .localeCompare(b.source.toLowerCase());
          return sourceSortOrder === 'asc' ? comparison : -comparison;
        });

  return (
    <>
      {/* Header row */}
      <div className='mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700'>
        <div className={cx('grid grid-cols-5 items-center', 'md:grid-cols-5')}>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Job Title
          </span>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Company
          </span>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Score
          </span>
          <button
            onClick={handleSourceSort}
            className='flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left'
          >
            <span className='mr-4'>Source</span>
            {getSortIcon()}
          </button>
        </div>
      </div>

      <ul>
        {sortedJobs.map((job, i) => (
          <li
            key={i}
            className='hover:-translate-y-0.5 transition-transform cursor-pointer group'
            onClick={() => handleJobClick(job)}
          >
            <div
              className={cx(
                'grid grid-cols-5 items-center p-4 border rounded-lg mb-2 transition-colors',
                'md:grid-cols-5',
                'border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-800',
                'hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <h2
                className={cx(
                  'font-semibold text-gray-900 truncate pr-2 col-span-4',
                  'md:col-span-1',
                  'dark:text-white'
                )}
              >
                {job.title}
              </h2>
              <span
                className={cx(
                  'text-gray-600 truncate pr-2 hidden',
                  'md:block',
                  'dark:text-gray-400'
                )}
              >
                {job.company}
              </span>
              <div className='flex items-center'>
                <span className='text-blue-600 dark:text-blue-400 font-medium mr-2'>
                  {job.score}
                </span>
                <span
                  className={cx(
                    'h-3 w-3 rounded-full',
                    getBadgeColor(job.score)
                  )}
                />
              </div>
              <span
                className={cx(
                  'text-gray-900 font-medium truncate pr-2 hidden',
                  'md:block',
                  'dark:text-white'
                )}
              >
                {job.source}
              </span>
              <span
                className={cx(
                  'text-sm text-gray-500 justify-self-end hidden',
                  'md:block',
                  'dark:text-gray-400'
                )}
              >
                Click to view
              </span>
            </div>
          </li>
        ))}
      </ul>

      <JobModal
        isOpen={isModalOpen}
        onClose={closeModal}
        job={selectedJob}
        onHideJob={handleHideJob}
      />
    </>
  );
}
