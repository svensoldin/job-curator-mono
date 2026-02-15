import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import Dashboard from './_components/Dashboard';
import { prefetchAllUserTasks } from './_lib/queries';
import { queryClientSingleton } from '@/lib/tanstack-query/client';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  await prefetchAllUserTasks(queryClientSingleton, user.id);

  return <Dashboard user={user} />;
}
