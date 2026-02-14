import type { JobSearch } from '@repo/types';
import { useQuery, type QueryClient } from '@tanstack/react-query';

const QueryKeys = {
  allTasks: 'allTasks',
};

/**
 * POST request to fetch all of the user's search tasks
 * @param id the user's id in database
 */
const fetchAllUserTasks = async (id: string): Promise<JobSearch[]> => {
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

export const prefetchAllUserTasks = async (queryClient: QueryClient, id: string) =>
  await queryClient.prefetchQuery({
    queryKey: [QueryKeys.allTasks, id],
    queryFn: () => fetchAllUserTasks(id),
  });

export const useallUserTasks = (userId: string) =>
  useQuery({
    queryKey: [QueryKeys.allTasks, userId],
    queryFn: () => fetchAllUserTasks(userId),
  });
