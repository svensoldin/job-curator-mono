import Sidebar from '@/components/ui/Sidebar';
import { LOGIN } from '@/constants/routes';
import { getUserClient } from '@/lib/supabase/client';
import QueryProviderWrapper from '@/lib/tanstack-query/QueryProviderWrapper';
import { redirect } from 'next/navigation';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = getUserClient();

  if (!user) {
    redirect(LOGIN);
  }

  return (
    <>
      <Sidebar />
      <div className="bg-neutral-900 transition-colors px-16">
        <div className="min-h-screen">
          <main className="container mx-auto pl-32 py-16">
            <QueryProviderWrapper>{children}</QueryProviderWrapper>
          </main>
        </div>
      </div>
    </>
  );
}
