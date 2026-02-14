import type { JobSearch } from '@repo/types';
import { useQuery, type QueryClient } from '@tanstack/react-query';

const QueryKeys = {
  allSearches: 'allSearches',
};

/**
 * POST request to fetch all of the user's searches
 * @param id the user's id in database
 */
const fetchAllUserSearches = async (id: string): Promise<JobSearch[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_JOB_SCRAPER_URL}/jobs/results`, {
    method: 'POST',
    body: JSON.stringify({
      userId: id,
    }),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  const json = await res.json();

  return json;
};

export const prefetchAllUserSearches = async (queryClient: QueryClient, id: string) =>
  await queryClient.prefetchQuery({
    queryKey: [QueryKeys.allSearches, id],
    queryFn: () => fetchAllUserSearches(id),
  });

export const useAllSearches = (userId: string) =>
  useQuery({
    queryKey: [QueryKeys.allSearches, userId],
    queryFn: () => fetchAllUserSearches(userId),
  });
