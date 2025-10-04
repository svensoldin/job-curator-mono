import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JobSearchWithStats } from '@/types/database';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch user's job searches with stats
  const { data: searches, error: searchesError } = await supabase
    .from('job_searches_with_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchesError) {
    console.error('Error fetching searches:', searchesError);
  }

  return (
    <DashboardClient 
      searches={(searches as unknown as JobSearchWithStats[]) || []} 
      userEmail={user.email || 'User'}
    />
  );
}
