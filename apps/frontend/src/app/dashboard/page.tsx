import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JobSearchWithStats } from '@/types/database';
import DashboardClient from './DashboardClient';
import { LOGIN } from '@/routes';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN);

  const { data, error: searchesError } = await supabase
    .from('job_searches_with_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (searchesError) {
    console.error('Error fetching searches:', searchesError);
  }

  return (
    <DashboardClient
      data={(data as unknown as JobSearchWithStats[]) || []}
      userEmail={user.email || 'User'}
    />
  );
}
