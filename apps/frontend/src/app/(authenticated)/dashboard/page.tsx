import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { LOGIN, PROFILE } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { getQueryClient } from '@/lib/tanstack-query/client';
import { prefetchProfileByUser } from '@/app/(authenticated)/profile/_lib/prefetch';

import Dashboard from './_components/Dashboard';
import { prefetchMatchesByUser } from './_lib/prefetch';
import { PROFILE_QUERY_KEY } from '../profile/_lib/queries';

const DashboardPage = async () => {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  const queryClient = getQueryClient();

  await prefetchProfileByUser(queryClient, user.id);

  const profileState = queryClient.getQueryState([PROFILE_QUERY_KEY, user.id]);
  if (profileState?.error) redirect(PROFILE);

  await prefetchMatchesByUser(queryClient, user.id);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard user={user} />
    </HydrationBoundary>
  );
};

export default DashboardPage;
