'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobSearchWithStats } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import PendingTasksSection from './components/PendingTasksSection';
import SearchCard from './components/SearchCard';
import EmptyState from './components/EmptyState';
import { SEARCH } from '@/constants/routes';

interface DashboardClientProps {
  data: JobSearchWithStats[];
  userEmail: string;
}

export default function DashboardClient({ data: initialData, userEmail }: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searches, setSearches] = useState<JobSearchWithStats[]>(initialData);

  useEffect(() => {
    setSearches(initialData);
  }, [initialData]);
  console.log(searches);
  const pendingSearchIds = searches
    .filter((search) => search.total_jobs === 0)
    .map((search) => search.id);

  const handleDeleteSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this search and all its results?')) {
      return;
    }

    setSearches((prev) => prev.filter((search) => search.id !== searchId));

    const { error } = await supabase.from('job_searches').delete().eq('id', searchId);

    if (error) {
      console.error('Error deleting search:', error);
      alert('Failed to delete search');
      // Rollback optimistic update
      setSearches(initialData);
    }
  };

  const handleSearchComplete = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pl-32 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Job Searches
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {userEmail}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
