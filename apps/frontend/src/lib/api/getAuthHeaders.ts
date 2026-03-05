import { createClient } from '@/lib/supabase/client';

export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) throw new Error('Not authenticated');

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
};
