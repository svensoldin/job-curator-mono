import { redirect } from 'next/navigation';

import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { getQueryClient } from '@/lib/tanstack-query/client';

import Dashboard from './_components/Dashboard';
import { prefetchSearchTasksByUser } from './_lib/queries';

const DashboardPage = async () => {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  const queryClient = getQueryClient();

  await prefetchSearchTasksByUser(queryClient, user.id);

  return <Dashboard user={user} />;
};

export default DashboardPage;
