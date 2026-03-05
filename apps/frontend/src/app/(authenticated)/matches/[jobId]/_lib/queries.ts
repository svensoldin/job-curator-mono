import type { MatchWithJob } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

import { getAuthHeaders } from '@/lib/api/getAuthHeaders';
import { BASE } from '@/lib/api/apiBase';

export const MATCH_DETAIL_QUERY_KEY = 'matchDetail';

export const fetchMatchDetail = async (
  userId: string,
  jobId: string,
  getHeaders: typeof getAuthHeaders = getAuthHeaders
): Promise<MatchWithJob> => {
  const headers = await getHeaders();
  const url = `${BASE}/matches/${userId}/job/${jobId}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`[fetch] ${url} returned ${res.status}`);
    throw new Error('Failed to fetch match detail');
  }
  const json = await res.json();
  return json.data as MatchWithJob;
};

export const useMatchDetail = (userId: string, jobId: string) =>
  useQuery<MatchWithJob, Error>({
    queryKey: [MATCH_DETAIL_QUERY_KEY, userId, jobId],
    queryFn: () => fetchMatchDetail(userId, jobId),
  });
