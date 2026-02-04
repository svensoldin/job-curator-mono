'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PendingSearch {
  id: string;
  job_title: string;
  location: string;
  created_at: string;
}

interface PendingTasksSectionProps {
  searchIds: string[];
  onSearchComplete?: (searchId: string) => void;
}

export default function PendingTasksSection({
  searchIds,
  onSearchComplete,
}: PendingTasksSectionProps) {
  const router = useRouter();
  const [pendingSearches, setPendingSearches] = useState<PendingSearch[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (searchIds.length === 0) {
      setPendingSearches([]);
      return;
    }

    // Fetch pending search details from database
    const fetchPendingSearches = async () => {
      const { data, error } = await supabase
        .from('job_searches')
        .select('id, job_title, location, created_at')
        .in('id', searchIds);

      if (error) {
        console.error('Error fetching pending searches:', error);
        return;
      }

      setPendingSearches(data || []);
    };

    fetchPendingSearches();

    const channel = supabase
      .channel('pending-searches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_searches',
          filter: `id=in.(${searchIds.join(',')})`,
        },
        (payload) => {
          const updatedSearch = payload.new as {
            id: string;
            total_jobs: number;
          };

          // If total_jobs changed from 0 to something, the search is complete
          if (updatedSearch.total_jobs > 0) {
            setPendingSearches((prev) =>
              prev.filter((search) => search.id !== updatedSearch.id)
            );

            if (onSearchComplete) {
              onSearchComplete(updatedSearch.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchIds, router, supabase, onSearchComplete]);
  if (pendingSearches.length === 0) {
    return null;
  }

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
        Processing Searches 🔄
      </h2>
      <div className='space-y-4'>
        {pendingSearches.map((search) => (
          <PendingTaskCard key={search.id} search={search} />
        ))}
      </div>
    </div>
  );
}

function PendingTaskCard({ search }: { search: PendingSearch }) {
  return (
    <div className='bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6'>
      <div className='flex items-start justify-between mb-3'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            {search.job_title}
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {search.location}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium flex items-center gap-2'>
            <svg
              className='w-4 h-4 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
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
            Processing
          </span>
        </div>
      </div>

      <div className='mb-2'>
        <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
          Scraping job boards and analyzing results with AI...
        </p>
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'>
          <div
            className='bg-blue-600 h-2 animate-pulse'
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
        This usually takes 5-10 minutes. The page will auto-refresh when
        complete via real-time updates.
      </p>
    </div>
  );
}
