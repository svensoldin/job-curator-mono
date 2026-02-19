import SearchSummary from '@/app/(authenticated)/search/[id]/_components/SearchSummary';
import {
  fetchSearchResultsById,
  prefetchSearchResultsById,
  prefetchSearchTaskById,
} from './_lib/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/tanstack-query/client';
import SearchDetailsClient from './_components/SearchDetailsClient';
import type { JobPost, SearchTask } from '@repo/types';

interface SearchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SearchDetailPage({ params }: SearchDetailPageProps) {
  const searchId = (await params).id;
  const queryClient = getQueryClient();

  await Promise.all([
    prefetchSearchResultsById(queryClient, searchId),
    prefetchSearchTaskById(queryClient, searchId),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchDetailsClient searchId={searchId} />
    </HydrationBoundary>
  );
}
