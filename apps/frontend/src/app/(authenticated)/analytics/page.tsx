import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LOGIN } from '@/constants/routes';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN);
  }

  const { data: searches } = await supabase
    .from('job_searches')
    .select(
      `
      id,
      job_title,
      location,
      created_at,
      total_jobs,
      job_results (count)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const { data: jobResults } = await supabase
    .from('job_results')
    .select(
      `
      ai_score,
      created_at,
      search_id,
      job_searches!inner (user_id)
    `
    )
    .eq('job_searches.user_id', user.id)
    .order('created_at', { ascending: true });

  return <AnalyticsClient searches={searches || []} jobResults={jobResults || []} />;
}
