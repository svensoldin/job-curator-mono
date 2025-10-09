'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobSearchWithStats } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import PendingTasksSection from './components/PendingTasksSection';
import SearchCard from './components/SearchCard';
import EmptyState from './components/EmptyState';
import { LOGIN, SEARCH } from '@/routes';

interface DashboardClientProps {
  data: JobSearchWithStats[];
  userEmail: string;
}

export default function DashboardClient({
  data: initialData,
  userEmail,
}: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searches, setSearches] = useState<JobSearchWithStats[]>(initialData);

  useEffect(() => {
    setSearches(initialData);
  }, [initialData]);

  const pendingSearchIds = searches
    .filter((search) => search.total_jobs === 0)
    .map((search) => search.id);

  const handleDeleteSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        'Are you sure you want to delete this search and all its results?'
      )
    ) {
      return;
    }

    setSearches((prev) => prev.filter((search) => search.id !== searchId));

    const { error } = await supabase
      .from('job_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('Error deleting search:', error);
      alert('Failed to delete search');
      // Rollback optimistic update
      setSearches(initialData);
    }
  };

  const handleSearchComplete = (searchId: string) => {
    router.refresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(LOGIN);
  };

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

        {pendingSearchIds.length > 0 ? (
          <PendingTasksSection
            searchIds={pendingSearchIds}
            onSearchComplete={handleSearchComplete}
          />
        ) : null}

        {searches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {searches.map((search) => (
              <SearchCard
                key={search.id}
                search={search}
                href={`${SEARCH}/${search.id}`}
                onDelete={(e) => handleDeleteSearch(search.id, e)}
                isPending={pendingSearchIds.includes(search.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
