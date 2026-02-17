import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import Dashboard from './_components/Dashboard';
import { prefetchSearchTasksByUser } from './_lib/queries';
import { queryClientSingleton } from '@/lib/tanstack-query/client';

const DashboardPage = async () => {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  await prefetchSearchTasksByUser(queryClientSingleton, user.id);

  return <Dashboard user={user} />;
};

export default DashboardPage;
