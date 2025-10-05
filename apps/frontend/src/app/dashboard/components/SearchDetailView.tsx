'use client';

import { useState, useEffect } from 'react';
import { JobSearchWithStats, JobResult } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import JobResultCard from './JobResultCard';

interface SearchDetailViewProps {
  search: JobSearchWithStats;
  onBack: () => void;
}

export default function SearchDetailView({
  search,
  onBack,
}: SearchDetailViewProps) {
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('job_results')
        .select('*')
        .eq('search_id', search.id)
        .order('ai_score', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching job results:', error);
      } else {
        setJobResults(data || []);
      }

      setIsLoading(false);
    };

    fetchResults();
  }, [search.id, supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <button
            onClick={onBack}
            className='cursor-pointer flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
          >
            <svg
              className='w-5 h-5 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Search Details */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            {search.job_title}
          </h1>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
            <div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Location
              </div>
              <div className='font-medium text-gray-900 dark:text-white'>
                {search.location}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Skills
              </div>
              <div className='font-medium text-gray-900 dark:text-white'>
                {search.skills}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Salary
              </div>
              <div className='font-medium text-gray-900 dark:text-white'>
                {search.salary}k€
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Date
              </div>
              <div className='font-medium text-gray-900 dark:text-white'>
                {formatDate(search.created_at)}
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex items-center'>
              <span className='text-2xl font-bold text-blue-600 dark:text-blue-400 mr-2'>
                {search.result_count}
              </span>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Results
              </span>
            </div>
            {search.avg_ai_score && (
              <div className='flex items-center'>
                <span className='text-2xl font-bold text-green-600 dark:text-green-400 mr-2'>
                  {Math.round(search.avg_ai_score)}
                </span>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Avg Score
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Job Results */}
        {isLoading ? (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600 dark:text-gray-400'>
              Loading results...
            </p>
          </div>
        ) : jobResults.length === 0 ? (
          <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            <p className='text-gray-600 dark:text-gray-400'>
              No results found for this search
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {jobResults.map((job) => (
              <JobResultCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
