import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import DashboardClient from './_components/DashboardClient';
import { prefetchAllUserTasks } from './_lib/queries';
import { queryClient } from '../layout';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  await prefetchAllUserTasks(queryClient, user.id);

  return <DashboardClient user={user} />;
}
