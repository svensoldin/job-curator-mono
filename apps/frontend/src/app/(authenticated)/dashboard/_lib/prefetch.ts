import type { QueryClient } from '@tanstack/react-query';

import { getAuthHeadersServer } from '@/lib/api/getAuthHeadersServer';
import { fetchMatchesByUser, USER_MATCHES_QUERY_KEY } from './queries';

export const prefetchMatchesByUser = async (queryClient: QueryClient, userId: string) =>
  queryClient.prefetchQuery({
    queryKey: [USER_MATCHES_QUERY_KEY, userId],
    queryFn: () => fetchMatchesByUser(userId, getAuthHeadersServer),
  });
