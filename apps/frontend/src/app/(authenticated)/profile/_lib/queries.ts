import type { UserProfile } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

import { getAuthHeaders } from '@/lib/api/getAuthHeaders';

const BASE = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;

export class ProfileNotFoundError extends Error {
  constructor() {
    super('PROFILE_NOT_FOUND');
    this.name = 'ProfileNotFoundError';
  }
}

const fetchProfile = async (userId: string): Promise<UserProfile> => {
  const headers = await getAuthHeaders();
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

export const useProfile = (userId: string) =>
  useQuery<UserProfile, Error>({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    retry: (_, err) => !(err instanceof ProfileNotFoundError),
  });
