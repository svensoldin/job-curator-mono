import { useMutation } from '@tanstack/react-query';

import { getAuthHeaders } from '@/lib/api/getAuthHeaders';

const BASE = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;

export const useTriggerMatching = () =>
  useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE}/matches/trigger/${userId}`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed to trigger matching');
      return res.json();
    },
  });
