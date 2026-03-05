import type { QueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@repo/types';

import { getAuthHeadersServer } from '@/lib/api/getAuthHeadersServer';
import { ProfileNotFoundError } from './queries';

const BASE = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;

const fetchProfileServer = async (userId: string): Promise<UserProfile> => {
  const headers = await getAuthHeadersServer();
  const res = await fetch(`${BASE}/profiles/${userId}`, { headers });

  if (res.status === 404) {
    throw new ProfileNotFoundError();
  }

  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }

  const json = await res.json();
  return json.data as UserProfile;
};

export const prefetchProfileByUser = async (queryClient: QueryClient, userId: string) =>
  queryClient.prefetchQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfileServer(userId),
  });
