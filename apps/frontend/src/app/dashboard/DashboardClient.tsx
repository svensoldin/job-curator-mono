'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobSearchWithStats, JobResult } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface DashboardClientProps {
  searches: JobSearchWithStats[];
  userEmail: string;
}

export default function DashboardClient({ searches, userEmail }: DashboardClientProps) {
  const router = useRouter();
  const [selectedSearch, setSelectedSearch] = useState<JobSearchWithStats | null>(null);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const supabase = createClient();

  const handleViewSearch = async (search: JobSearchWithStats) => {
    setSelectedSearch(search);
    setIsLoadingResults(true);

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

    setIsLoadingResults(false);
  };

  const handleDeleteSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this search and all its results?')) {
      return;
    }

    const { error } = await supabase
      .from('job_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('Error deleting search:', error);
      alert('Failed to delete search');
    } else {
      router.refresh();
      if (selectedSearch?.id === searchId) {
        setSelectedSearch(null);
        setJobResults([]);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

  // Detail view when a search is selected
  if (selectedSearch) {
    return (
      <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
        <div className='container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <button
              onClick={() => {
                setSelectedSearch(null);
                setJobResults([]);
              }}
              className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
            >
              <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* Search Details */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
              {selectedSearch.job_title}
            </h1>
            
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
              <div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>Location</div>
                <div className='font-medium text-gray-900 dark:text-white'>{selectedSearch.location}</div>
              </div>
              <div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>Skills</div>
                <div className='font-medium text-gray-900 dark:text-white'>{selectedSearch.skills}</div>
              </div>
              <div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>Salary</div>
                <div className='font-medium text-gray-900 dark:text-white'>{selectedSearch.salary}k€</div>
              </div>
              <div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>Date</div>
                <div className='font-medium text-gray-900 dark:text-white'>
                  {formatDate(selectedSearch.created_at)}
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <div className='flex items-center'>
                <span className='text-2xl font-bold text-blue-600 dark:text-blue-400 mr-2'>
                  {selectedSearch.result_count}
                </span>
                <span className='text-sm text-gray-600 dark:text-gray-400'>Results</span>
              </div>
              {selectedSearch.avg_ai_score && (
                <div className='flex items-center'>
                  <span className='text-2xl font-bold text-green-600 dark:text-green-400 mr-2'>
                    {Math.round(selectedSearch.avg_ai_score)}
                  </span>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>Avg Score</span>
                </div>
              )}
            </div>
          </div>

          {/* Job Results */}
          {isLoadingResults ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600 dark:text-gray-400'>Loading results...</p>
            </div>
          ) : jobResults.length === 0 ? (
            <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
              <p className='text-gray-600 dark:text-gray-400'>No results found for this search</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {jobResults.map((job) => (
                <div
                  key={job.id}
                  className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-1'>
                        {job.title}
                      </h3>
                      <p className='text-gray-600 dark:text-gray-400'>
                        {job.company} • {job.source}
                      </p>
                    </div>
                    {job.ai_score !== null && (
                      <div className='text-right ml-4'>
                        <div
                          className={`text-3xl font-bold ${
                            job.ai_score >= 80
                              ? 'text-green-600'
                              : job.ai_score >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {job.ai_score}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>Score</div>
                      </div>
                    )}
                  </div>

                  {job.description && (
                    <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4'>
                      <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-3'>
                        {job.description.substring(0, 300)}...
                      </p>
                    </div>
                  )}

                  <a
                    href={job.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
                  >
                    View Job Posting
                    <svg className='ml-2 w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                      />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard list view
  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
              My Job Searches
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>
              Welcome back, {userEmail}
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <Link
              href='/search'
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              New Search
            </Link>
            <button
              onClick={handleSignOut}
              className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Searches List */}
        {searches.length === 0 ? (
          <div className='text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'>
            <div className='mb-4'>
              <svg
                className='w-16 h-16 mx-auto text-gray-400 dark:text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
              No searches yet
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-6'>
              Start your first job search to see results here
            </p>
            <Link
              href='/search'
              className='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              Start Searching
              <svg className='ml-2 w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 8l4 4m0 0l-4 4m4-4H3'
                />
              </svg>
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {searches.map((search) => (
              <div
                key={search.id}
                onClick={() => handleViewSearch(search)}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all'
              >
                <div className='flex items-start justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white flex-1'>
                    {search.job_title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteSearch(search.id, e)}
                    className='text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors'
                    title='Delete search'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                    {search.location}
                  </div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                      <div className='text-xs text-gray-500 dark:text-gray-400'>Results</div>
                    </div>
                    {search.avg_ai_score && (
                      <div>
                        <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                          {Math.round(search.avg_ai_score)}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>Avg Score</div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
