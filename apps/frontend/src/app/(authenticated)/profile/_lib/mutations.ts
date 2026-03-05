import type { HardConstraints, UserProfile } from '@repo/types';
import { useMutation } from '@tanstack/react-query';

import { getAuthHeaders } from '@/lib/api/getAuthHeaders';

const BASE = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;

interface UpsertProfilePayload {
  userId: string;
  hardConstraints?: HardConstraints;
  skillGraph?: Record<string, number>;
  seniority?: UserProfile['seniority'];
  culturePreference?: UserProfile['culture_preference'];
}

const upsertProfile = async (payload: UpsertProfilePayload): Promise<UserProfile> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/profiles`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to save profile');
  }

  const json = await res.json();
  return json.data as UserProfile;
};

export const useUpsertProfile = () =>
  useMutation({
    mutationFn: (payload: UpsertProfilePayload) => upsertProfile(payload),
    throwOnError: true,
  });
