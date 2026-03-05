import type { UserProfile } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

import { getAuthHeaders } from '@/lib/api/getAuthHeaders';
import { BASE } from '@/lib/api/apiBase';

export class ProfileNotFoundError extends Error {
  constructor() {
    super('PROFILE_NOT_FOUND');
    this.name = 'ProfileNotFoundError';
  }
}

export const fetchProfile = async (
  userId: string,
  getHeaders: () => Promise<HeadersInit> = getAuthHeaders
): Promise<UserProfile> => {
  const headers = await getHeaders();
  const url = `${BASE}/profiles/${userId}`;
  const res = await fetch(url, { headers });

  if (res.status === 404) {
    throw new ProfileNotFoundError();
  }

  if (!res.ok) {
    console.error(`[fetch] ${url} returned ${res.status}`);
    throw new Error('Failed to fetch profile');
  }

  const json = await res.json();
  return json.data as UserProfile;
};

export const PROFILE_QUERY_KEY = 'profile';

export const useProfile = (userId: string) =>
  useQuery<UserProfile, Error>({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => fetchProfile(userId),
    retry: (_, err) => !(err instanceof ProfileNotFoundError),
  });
