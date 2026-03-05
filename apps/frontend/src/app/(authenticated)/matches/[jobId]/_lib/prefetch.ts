import type { QueryClient } from '@tanstack/react-query';

import { getAuthHeadersServer } from '@/lib/api/getAuthHeadersServer';
import { fetchMatchDetail, MATCH_DETAIL_QUERY_KEY } from './queries';

export const prefetchMatchDetail = async (
  queryClient: QueryClient,
  userId: string,
  jobId: string
) =>
  queryClient.prefetchQuery({
    queryKey: [MATCH_DETAIL_QUERY_KEY, userId, jobId],
    queryFn: () => fetchMatchDetail(userId, jobId, getAuthHeadersServer),
  });
