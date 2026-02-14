import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import DashboardClient from './DashboardClient';
import { prefetchAllUserSearches, useAllSearches } from './lib/queries';
import { queryClient } from '../layout';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  const searches = await prefetchAllUserSearches(queryClient, user.id);

  return <DashboardClient email={user.email!} />;
}
