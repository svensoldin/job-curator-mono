import { createClient } from '@/lib/supabase/server';

export const getAuthHeadersServer = async (): Promise<HeadersInit> => {
  const supabase = await createClient();
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
