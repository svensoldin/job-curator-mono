import { redirect } from 'next/navigation';

import { LOGIN } from '@/constants/routes';
import { UserContextProvider } from '@/context/UserContext';
import { getUser } from '@/lib/supabase/server';
import QueryProviderWrapper from '@/lib/tanstack-query/QueryProviderWrapper';
import Sidebar from '@/components/ui/Sidebar';

const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUser();

  if (!user) {
    redirect(LOGIN);
  }

  return (
    <>
      <Sidebar />
      <main className='flex justify-center items-center container min-h-screen mx-auto pl-32 py-16'>
        <UserContextProvider initialUser={user}>
          <QueryProviderWrapper>{children}</QueryProviderWrapper>
        </UserContextProvider>
      </main>
    </>
  );
};

export default AuthenticatedLayout;
