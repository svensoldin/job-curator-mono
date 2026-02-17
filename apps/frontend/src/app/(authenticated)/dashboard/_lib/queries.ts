import type { SearchTask } from '@repo/types';
import { useQuery, type QueryClient } from '@tanstack/react-query';

export const QueryKeys = {
  allTasks: 'allTasks',
};

/**
 * POST request to fetch all of the user's search tasks
 * @param id the user's id in database
 */
const fetchSearchTasksByUser = async (userId: string): Promise<SearchTask[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_JOB_SCRAPER_URL}/searches`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user tasks');
  }

  const json = await res.json();

  return json.data;
};

export const prefetchSearchTasksByUser = async (queryClient: QueryClient, userId: string) =>
  await queryClient.prefetchQuery({
    queryKey: [QueryKeys.allTasks, userId],
    queryFn: () => fetchSearchTasksByUser(userId),
  });

export const useSearchTasksByUser = (userId: string) =>
  useQuery({
    queryKey: [QueryKeys.allTasks, userId],
    queryFn: () => fetchSearchTasksByUser(userId),
  });
