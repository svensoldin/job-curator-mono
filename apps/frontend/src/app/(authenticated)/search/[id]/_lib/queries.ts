import type { JobPost, SearchTask } from '@repo/types';
import { type QueryClient, useQuery } from '@tanstack/react-query';

const GET_RESULTS_ENDPOINT = `${process.env.NEXT_PUBLIC_JOB_SCRAPER_URL}/results`;
const GET_SEARCH_TASK_ENDPOINT = `${process.env.NEXT_PUBLIC_JOB_SCRAPER_URL}/searches`;

const QueryKeys = {
  searchResults: 'searchResults',
  searchTask: 'searchTask',
};

/**
 * GET search task results by id
 * @param id the user's id in database
 */
export const fetchSearchResultsById = async (id: string): Promise<JobPost[]> => {
  const res = await fetch(`${GET_RESULTS_ENDPOINT}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user tasks');
  }

  const json = await res.json();

  return json.data;
};

export const prefetchSearchResultsById = async (queryClient: QueryClient, id: string) =>
  await queryClient.prefetchQuery({
    queryKey: [QueryKeys.searchResults, id],
    queryFn: () => fetchSearchResultsById(id),
  });

export const useSearchResultsById = (id: string) =>
  useQuery({
    queryKey: [QueryKeys.searchResults, id],
    queryFn: () => fetchSearchResultsById(id),
  });

/**
 * GET a search task by id
 * @param id the id of the SearchTask
 * @returns a promise of a SearchTask
 */
export const fetchSearchTaskById = async (id: string): Promise<SearchTask> => {
  const res = await fetch(`${GET_SEARCH_TASK_ENDPOINT}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch search task by id');
  }

  const json = await res.json();

  return json.data[0];
};

export const prefetchSearchTaskById = async (queryClient: QueryClient, id: string) =>
  await queryClient.prefetchQuery({
    queryKey: [QueryKeys.searchTask, id],
    queryFn: () => fetchSearchTaskById(id),
  });

export const useSearchTaskById = (id: string) =>
  useQuery({
    queryKey: [QueryKeys.searchTask, id],
    queryFn: () => fetchSearchTaskById(id),
  });
