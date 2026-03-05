import type { MatchWithJob } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

import { getAuthHeaders } from '@/lib/api/getAuthHeaders';
import { BASE } from '@/lib/api/apiBase';

export const USER_MATCHES_QUERY_KEY = 'userMatches';

export const fetchMatchesByUser = async (
  userId: string,
  getHeaders: typeof getAuthHeaders = getAuthHeaders
): Promise<MatchWithJob[]> => {
  const headers = await getHeaders();
  const url = `${BASE}/matches/${userId}?limit=50&minScore=0&hiddenGemsOnly=false`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`[fetch] ${url} returned ${res.status}`);
    throw new Error('Failed to fetch matches');
  }
  const json = await res.json();
  return (json.data ?? []) as MatchWithJob[];
};

export const useMatchesByUser = (userId: string) =>
  useQuery<MatchWithJob[], Error>({
    queryKey: [USER_MATCHES_QUERY_KEY, userId],
    queryFn: () => fetchMatchesByUser(userId),
  });
