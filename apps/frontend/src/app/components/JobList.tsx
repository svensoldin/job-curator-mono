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

  // Filter out hidden jobs
  const visibleJobs = jobs.filter((job) => !hiddenJobs.includes(job.url));

  return (
    <>
      <ul>
        {visibleJobs.map((job, i) => (
          <li
            key={i}
            className='hover:-translate-y-0.5 transition-transform cursor-pointer group'
            onClick={() => handleJobClick(job)}
          >
            <div className='grid grid-cols-4 items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
              <h2 className='font-semibold text-gray-900 dark:text-white'>
                {job.title}
              </h2>
              <span className='text-gray-600 dark:text-gray-400'>
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
              <span className='text-sm text-gray-500 dark:text-gray-400 justify-self-end'>
                Click to view details
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
