import { redirect } from 'next/navigation';

import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { getAllSearches } from '@/lib/api/queries';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  const searches = await getAllSearches(user.id);

  return <DashboardClient data={searches} userEmail={user.email!} />;
}
