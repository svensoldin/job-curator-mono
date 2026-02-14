'use client';

import { useRouter } from 'next/navigation';

import PendingTasksSection from './components/PendingTasksSection';
import SearchCard from './components/SearchCard';
import EmptyState from './components/EmptyState';
import { SEARCH } from '@/constants/routes';
import { useAllSearches } from './lib/queries';
import { getUser } from '@/lib/supabase/server';

interface DashboardClientProps {
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { data } = useAllSearches(user.id);

  const router = useRouter();

  const handleSearchComplete = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pl-32 py-16">
        <div className="flex items-center justify-between mb-8">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Job Searches
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.email}</p>
          </header>
        </div>

        <PendingTasksSection searchIds={pendingSearchIds} onSearchComplete={handleSearchComplete} />

        {searches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
