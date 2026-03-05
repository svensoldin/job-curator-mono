import { redirect } from 'next/navigation';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { getQueryClient } from '@/lib/tanstack-query/client';

import ProfileForm from './_components/ProfileForm';
import { prefetchProfileByUser } from './_lib/prefetch';

const ProfilePage = async () => {
  const user = await getUser();

  if (!user) redirect(LOGIN);

  const queryClient = getQueryClient();
  await prefetchProfileByUser(queryClient, user.id);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileForm user={user} />
    </HydrationBoundary>
  );
};

export default ProfilePage;
