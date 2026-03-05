import type { QueryClient } from '@tanstack/react-query';

import { getAuthHeadersServer } from '@/lib/api/getAuthHeadersServer';
import { fetchProfile, PROFILE_QUERY_KEY } from './queries';

export const prefetchProfileByUser = async (queryClient: QueryClient, userId: string) =>
  queryClient.prefetchQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => fetchProfile(userId, getAuthHeadersServer),
  });
