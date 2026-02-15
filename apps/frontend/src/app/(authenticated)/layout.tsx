import Sidebar from '@/components/ui/Sidebar';
import { LOGIN } from '@/constants/routes';
import { UserContextProvider } from '@/context/UserContext';
import { getUser } from '@/lib/supabase/server';
import QueryProviderWrapper from '@/lib/tanstack-query/QueryProviderWrapper';
import { redirect } from 'next/navigation';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect(LOGIN);
  }

  return (
    <>
      <Sidebar />
      <div className='bg-black transition-colors px-16'>
        <div className='min-h-screen'>
          <main className='container mx-auto pl-32 py-16'>
            <UserContextProvider initialUser={user}>
              <QueryProviderWrapper>{children}</QueryProviderWrapper>
            </UserContextProvider>
          </main>
        </div>
      </div>
    </>
  );
}
