import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JobSearchWithStats } from '@/types/database';
import DashboardClient from './DashboardClient';
import { LOGIN } from '@/constants/routes';
import { getAllSearches } from '@/lib/api/queries';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN);

  const searches = await getAllSearches(user.id);

  return <DashboardClient data={searches} userEmail={user.email!} />;
}
