'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobSearchWithStats } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import PendingTasksSection from './components/PendingTasksSection';
import SearchCard from './components/SearchCard';
import SearchDetailView from './components/SearchDetailView';
import EmptyState from './components/EmptyState';

interface DashboardClientProps {
  data: JobSearchWithStats[];
  userEmail: string;
}

export default function DashboardClient({
  data,
  userEmail,
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedSearch, setSelectedSearch] =
    useState<JobSearchWithStats | null>(null);
  const supabase = createClient();

  // Get IDs of searches with no results (pending)
  const pendingSearchIds = data
    .filter((search) => search.total_jobs === 0)
    .map((search) => search.id);

  const handleViewSearch = (search: JobSearchWithStats) => {
    setSelectedSearch(search);
  };

  const handleDeleteSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        'Are you sure you want to delete this search and all its results?'
      )
    ) {
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
      // Clean up localStorage for deleted search
      localStorage.removeItem(`task_${searchId}`);
      localStorage.removeItem(`task_title_${searchId}`);

      router.refresh();
      if (selectedSearch?.id === searchId) {
        setSelectedSearch(null);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Detail view when a search is selected
  if (selectedSearch) {
    return (
      <SearchDetailView
        search={selectedSearch}
        onBack={() => setSelectedSearch(null)}
      />
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

        {/* Pending Tasks Section */}
        <PendingTasksSection searchIds={pendingSearchIds} />

        {/* Searches List */}
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {data.map((search) => (
              <SearchCard
                key={search.id}
                search={search}
                onClick={() => handleViewSearch(search)}
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
