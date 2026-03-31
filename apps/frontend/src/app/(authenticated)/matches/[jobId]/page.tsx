import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { getQueryClient } from '@/lib/tanstack-query/client';

import MatchDetailClient from './_components/MatchDetailClient';
import { prefetchMatchDetail } from './_lib/prefetch';

interface MatchDetailPageProps {
  params: Promise<{ jobId: string }>;
}

const MatchDetailPage = async ({ params }: MatchDetailPageProps) => {
  const { jobId } = await params;
  const user = await getUser();

  if (!user) redirect(LOGIN);

  const queryClient = getQueryClient();
  await prefetchMatchDetail(queryClient, user.id, jobId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MatchDetailClient userId={user.id} jobId={jobId} />
    </HydrationBoundary>
  );
};

export default MatchDetailPage;
